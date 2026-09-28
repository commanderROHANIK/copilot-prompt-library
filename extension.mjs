// Extension: prompt-library
// Reusable prompt library: save/list/render prompts with {{VAR}} placeholders via chat tools and a canvas browser UI.

import { joinSession, createCanvas } from "@github/copilot-sdk/extension";
import { promises as fsp } from "node:fs";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// One Markdown file per prompt, inside the extension folder, so the library is versioned with git.
const PROMPTS_DIR = path.join(__dirname, "prompts");
// Pre-git location used by the first version of this extension; imported once if PROMPTS_DIR is empty.
const LEGACY_STORE_FILE = path.join(os.homedir(), ".copilot", "prompt-library", "prompts.json");
const UI_FILE = path.join(__dirname, "ui.html");

const VAR_TOKEN_RE = /\{\{\s*([A-Z0-9_]+)\s*\}\}/g;

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function slugify(title) {
    const base = String(title || "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-+|-+$)/g, "");
    return base || "prompt";
}

function extractVariableNames(template) {
    const names = [];
    let m;
    VAR_TOKEN_RE.lastIndex = 0;
    while ((m = VAR_TOKEN_RE.exec(template || ""))) {
        if (!names.includes(m[1])) names.push(m[1]);
    }
    return names;
}

function renderTemplate(template, vars) {
    const provided = vars || {};
    const unresolved = [];
    const rendered = String(template || "").replace(VAR_TOKEN_RE, (whole, name) => {
        const v = provided[name];
        if (v !== undefined && v !== null && String(v).length > 0) return String(v);
        if (!unresolved.includes(name)) unresolved.push(name);
        return whole;
    });
    return { rendered, unresolved };
}

const SAFE_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

function oneLine(s) {
    return String(s ?? "").replace(/[\r\n]+/g, " ").trim();
}

// File format (prompts/<id>.md):
//   ---
//   title: <title>
//   variables:
//     - <NAME>: <description>
//   ---
//   <template body>
function serializePrompt(p) {
    const lines = ["---", `title: ${oneLine(p.title)}`];
    const vars = p.variables || [];
    if (vars.length > 0) {
        lines.push("variables:");
        for (const v of vars) {
            const desc = oneLine(v.description);
            lines.push(`  - ${oneLine(v.name)}:${desc ? " " + desc : ""}`);
        }
    }
    lines.push("---", "");
    return lines.join("\n") + String(p.template || "").replace(/\r\n/g, "\n") + "\n";
}

function parsePrompt(id, raw) {
    const text = String(raw).replace(/\r\n/g, "\n");
    const p = { id, title: id, template: text, variables: [] };
    if (!text.startsWith("---\n")) return p;
    const end = text.indexOf("\n---\n", 3);
    if (end === -1) return p;
    const header = text.slice(4, end).split("\n");
    p.template = text.slice(end + 5).replace(/\n$/, "");
    let inVars = false;
    for (const line of header) {
        const varMatch = inVars && line.match(/^\s+-\s*([^:]+?)\s*:\s?(.*)$/);
        if (varMatch) {
            p.variables.push({ name: varMatch[1], description: varMatch[2].trim() });
            continue;
        }
        inVars = false;
        const kv = line.match(/^([A-Za-z]+):\s?(.*)$/);
        if (!kv) continue;
        if (kv[1] === "title") p.title = kv[2].trim() || id;
        if (kv[1] === "variables") inVars = true;
    }
    return p;
}

function promptPath(id) {
    if (!SAFE_ID_RE.test(id)) throw new Error(`Invalid prompt id "${id}"`);
    return path.join(PROMPTS_DIR, `${id}.md`);
}

async function readStore() {
    await fsp.mkdir(PROMPTS_DIR, { recursive: true });
    const files = (await fsp.readdir(PROMPTS_DIR)).filter((f) => f.endsWith(".md")).sort();
    const prompts = [];
    for (const f of files) {
        const id = f.slice(0, -3);
        if (!SAFE_ID_RE.test(id)) continue;
        try {
            prompts.push(parsePrompt(id, await fsp.readFile(path.join(PROMPTS_DIR, f), "utf8")));
        } catch {
            // unreadable file; skip rather than break the whole library
        }
    }
    return { prompts };
}

async function writePrompt(p) {
    await fsp.mkdir(PROMPTS_DIR, { recursive: true });
    const target = promptPath(p.id);
    // Write-then-rename so a concurrent reader in another session never sees a half-written file.
    const tmp = `${target}.${process.pid}.tmp`;
    await fsp.writeFile(tmp, serializePrompt(p), "utf8");
    await fsp.rename(tmp, target);
}

async function removePrompt(id) {
    await fsp.rm(promptPath(id), { force: true });
}

function uniqueId(data, title) {
    const base = slugify(title);
    let id = base;
    let suffix = 2;
    while (data.prompts.some((p) => p.id.toLowerCase() === id.toLowerCase())) id = `${base}-${suffix++}`;
    return id;
}

function findPromptIndex(data, idOrTitle) {
    const key = String(idOrTitle || "").toLowerCase();
    return data.prompts.findIndex((p) => p.id.toLowerCase() === key || p.title.toLowerCase() === key);
}

function summarize(p) {
    const preview = String(p.template || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 140);
    return {
        id: p.id,
        title: p.title,
        variables: p.variables || [],
        preview: preview + (String(p.template || "").length > 140 ? "…" : ""),
    };
}

async function importLegacyStoreIfEmpty() {
    const data = await readStore();
    if (data.prompts.length > 0) return;
    let legacy;
    try {
        legacy = JSON.parse(await fsp.readFile(LEGACY_STORE_FILE, "utf8"));
    } catch {
        return; // nothing to import; start empty
    }
    for (const p of legacy.prompts || []) {
        if (!p || !SAFE_ID_RE.test(String(p.id || ""))) continue;
        await writePrompt({ id: p.id, title: p.title, template: p.template, variables: p.variables || [] });
    }
}

await importLegacyStoreIfEmpty();

// ---------------------------------------------------------------------------
// Chat tools
// ---------------------------------------------------------------------------

const tools = [
    {
        name: "promptlib_list",
        description:
            "List all saved reusable prompts in the prompt library (id, title, variables, short preview).",
        parameters: { type: "object", properties: {} },
        handler: async () => {
            const data = await readStore();
            if (data.prompts.length === 0) return "No prompts saved yet.";
            return data.prompts
                .map(summarize)
                .map(
                    (p) =>
                        `${p.id} — vars: ${(p.variables.map((v) => v.name).join(", ") || "none")} — "${p.preview}"`,
                )
                .join("\n");
        },
    },
    {
        name: "promptlib_get",
        description: "Get the full template text and variable list for a saved prompt, by id or title.",
        parameters: {
            type: "object",
            properties: {
                id_or_title: { type: "string", description: "Prompt id or title." },
            },
            required: ["id_or_title"],
        },
        handler: async (args) => {
            const data = await readStore();
            const idx = findPromptIndex(data, args.id_or_title);
            if (idx === -1) return { textResultForLlm: `No prompt found matching "${args.id_or_title}".`, resultType: "failure" };
            const p = data.prompts[idx];
            const varsText = (p.variables || []).map((v) => `  - ${v.name}: ${v.description || ""}`).join("\n") || "  (none)";
            return `id: ${p.id}\ntitle: ${p.title}\nvariables:\n${varsText}\n\n--- template ---\n${p.template}`;
        },
    },
    {
        name: "promptlib_save",
        description:
            "Create or update a saved reusable prompt. Provide id to update an existing prompt; omit id to create a new one (id is derived from title). Use {{VAR_NAME}} tokens in the template for values to be filled in at run time.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "string", description: "Existing prompt id to update. Omit to create a new prompt." },
                title: { type: "string", description: "Prompt title." },
                template: {
                    type: "string",
                    description: "Prompt text. Use {{VAR_NAME}} tokens for fill-in values.",
                },
                variables: {
                    type: "array",
                    description:
                        "Optional explicit variable descriptions ([{name, description}]). If omitted, variables are auto-detected from {{VAR_NAME}} tokens in the template.",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string" },
                            description: { type: "string" },
                        },
                        required: ["name"],
                    },
                },
            },
            required: ["title", "template"],
        },
        handler: async (args) => {
            const data = await readStore();
            const autoVars = extractVariableNames(args.template).map((name) => ({ name, description: "" }));
            const variables = Array.isArray(args.variables) && args.variables.length > 0 ? args.variables : autoVars;

            if (args.id) {
                const idx = findPromptIndex(data, args.id);
                if (idx === -1) return { textResultForLlm: `No prompt found with id "${args.id}".`, resultType: "failure" };
                const updated = { ...data.prompts[idx], title: args.title, template: args.template, variables };
                await writePrompt(updated);
                return `Updated prompt "${updated.id}".`;
            }

            const id = uniqueId(data, args.title);
            await writePrompt({ id, title: args.title, template: args.template, variables });
            return `Created prompt "${id}".`;
        },
    },
    {
        name: "promptlib_delete",
        description: "Delete a saved prompt by id or title.",
        parameters: {
            type: "object",
            properties: {
                id_or_title: { type: "string", description: "Prompt id or title." },
            },
            required: ["id_or_title"],
        },
        handler: async (args) => {
            const data = await readStore();
            const idx = findPromptIndex(data, args.id_or_title);
            if (idx === -1) return { textResultForLlm: `No prompt found matching "${args.id_or_title}".`, resultType: "failure" };
            const removed = data.prompts[idx];
            await removePrompt(removed.id);
            return `Deleted prompt "${removed.id}".`;
        },
    },
    {
        name: "promptlib_render",
        description:
            "Render a saved prompt by substituting {{VAR_NAME}} tokens with the given variables. Returns the final text plus a list of any tokens left unresolved. Use the resulting text as a kickoff prompt for create_session (run multiple in parallel, e.g. one per PR) or to continue the current chat.",
        parameters: {
            type: "object",
            properties: {
                id_or_title: { type: "string", description: "Prompt id or title." },
                variables: {
                    type: "object",
                    description: "Map of variable name to value, e.g. { \"PR_ID\": \"1234\" }.",
                    additionalProperties: { type: "string" },
                },
            },
            required: ["id_or_title"],
        },
        handler: async (args) => {
            const data = await readStore();
            const idx = findPromptIndex(data, args.id_or_title);
            if (idx === -1) return { textResultForLlm: `No prompt found matching "${args.id_or_title}".`, resultType: "failure" };
            const p = data.prompts[idx];
            const { rendered, unresolved } = renderTemplate(p.template, args.variables || {});
            const warning = unresolved.length > 0 ? `\n\n[unresolved placeholders: ${unresolved.join(", ")}]` : "";
            return `${rendered}${warning}`;
        },
    },
];

// ---------------------------------------------------------------------------
// Canvas: local HTTP browse/edit UI
// ---------------------------------------------------------------------------

let session; // assigned after joinSession(); closures below read it at call time.
let serverState = null; // { server, port }

function readJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = "";
        req.on("data", (chunk) => (body += chunk));
        req.on("end", () => {
            if (!body) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(err);
            }
        });
        req.on("error", reject);
    });
}

function sendJson(res, status, obj) {
    const body = JSON.stringify(obj);
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(body);
}

async function handleApi(req, url, res) {
    const parts = url.pathname.split("/").filter(Boolean); // ["api", "prompts", ...]
    const method = req.method || "GET";

    if (parts.length === 2 && parts[1] === "prompts" && method === "GET") {
        const data = await readStore();
        return sendJson(res, 200, data.prompts.map(summarize));
    }

    if (parts.length === 2 && parts[1] === "prompts" && method === "POST") {
        const body = await readJsonBody(req);
        if (!body.title || !body.template) return sendJson(res, 400, { error: "title and template are required" });
        const data = await readStore();
        const entry = {
            id: uniqueId(data, body.title),
            title: body.title,
            template: body.template,
            variables: extractVariableNames(body.template).map((name) => ({ name, description: "" })),
        };
        await writePrompt(entry);
        return sendJson(res, 201, entry);
    }

    if (parts.length === 3 && parts[1] === "prompts" && method === "GET") {
        const data = await readStore();
        const idx = findPromptIndex(data, decodeURIComponent(parts[2]));
        if (idx === -1) return sendJson(res, 404, { error: "not found" });
        return sendJson(res, 200, data.prompts[idx]);
    }

    if (parts.length === 3 && parts[1] === "prompts" && method === "PUT") {
        const body = await readJsonBody(req);
        const data = await readStore();
        const idx = findPromptIndex(data, decodeURIComponent(parts[2]));
        if (idx === -1) return sendJson(res, 404, { error: "not found" });
        const existingVarDescByName = {};
        (data.prompts[idx].variables || []).forEach((v) => (existingVarDescByName[v.name] = v.description || ""));
        const variables = extractVariableNames(body.template || "").map((name) => ({
            name,
            description: existingVarDescByName[name] || "",
        }));
        const updated = {
            ...data.prompts[idx],
            title: body.title ?? data.prompts[idx].title,
            template: body.template ?? data.prompts[idx].template,
            variables,
        };
        await writePrompt(updated);
        return sendJson(res, 200, updated);
    }

    if (parts.length === 3 && parts[1] === "prompts" && method === "DELETE") {
        const data = await readStore();
        const idx = findPromptIndex(data, decodeURIComponent(parts[2]));
        if (idx === -1) return sendJson(res, 404, { error: "not found" });
        await removePrompt(data.prompts[idx].id);
        return sendJson(res, 200, { ok: true });
    }

    if (parts.length === 4 && parts[1] === "prompts" && parts[3] === "insert" && method === "POST") {
        const body = await readJsonBody(req);
        const data = await readStore();
        const idx = findPromptIndex(data, decodeURIComponent(parts[2]));
        if (idx === -1) return sendJson(res, 404, { error: "not found" });
        const { rendered, unresolved } = renderTemplate(data.prompts[idx].template, body.variables || {});
        const force = url.searchParams.get("force") === "1";
        if (unresolved.length > 0 && !force) {
            return sendJson(res, 409, { unresolved, rendered });
        }
        if (!session) return sendJson(res, 500, { error: "session not attached yet" });
        await session.send({ prompt: rendered });
        return sendJson(res, 200, { ok: true, rendered, unresolved });
    }

    return sendJson(res, 404, { error: "unknown route" });
}

async function ensureServer() {
    if (serverState) return serverState;
    const uiHtml = await fsp.readFile(UI_FILE, "utf8");
    const server = http.createServer(async (req, res) => {
        try {
            const url = new URL(req.url, "http://127.0.0.1");
            if (url.pathname === "/") {
                res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
                res.end(uiHtml);
                return;
            }
            if (url.pathname === "/favicon.ico") {
                res.writeHead(204);
                res.end();
                return;
            }
            if (url.pathname.startsWith("/api/")) {
                await handleApi(req, url, res);
                return;
            }
            res.writeHead(404);
            res.end("Not found");
        } catch (err) {
            sendJson(res, 500, { error: String((err && err.message) || err) });
        }
    });
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });
    const port = server.address().port;
    serverState = { server, port };
    return serverState;
}

const promptLibraryCanvas = createCanvas({
    id: "prompt-library",
    displayName: "Prompt Library",
    description: "Browse, edit, and run your saved reusable prompts (with {{VAR}} placeholders).",
    open: async () => {
        const { port } = await ensureServer();
        return { url: `http://127.0.0.1:${port}/`, title: "Prompt Library" };
    },
    onClose: async () => {
        // Keep the local server running for the lifetime of this extension process
        // (cheap, and other open panels/instances may still be pointed at it).
    },
});

session = await joinSession({
    tools,
    canvases: [promptLibraryCanvas],
});
