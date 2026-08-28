#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { tagGroups, tags } from "../src/data/tags.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function loadDotEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    if (!(k in process.env)) process.env[k] = v;
  }
}
loadDotEnv();

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/+$/, "");
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Не заданы SUPABASE_URL / SUPABASE_SERVICE_KEY");
  process.exit(1);
}
const headers = {
  apikey: SUPABASE_SERVICE_KEY,
  Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "resolution=merge-duplicates,return=minimal",
};

async function main() {
  const groupRows = tagGroups.map((g, i) => ({ id: g.id, label: g.label, sort_order: i }));
  let res = await fetch(`${SUPABASE_URL}/rest/v1/tag_groups`, { method: "POST", headers, body: JSON.stringify(groupRows) });
  if (!res.ok) throw new Error(`Группы тегов: ${res.status} ${await res.text()}`);

  const tagRows = tags.map((t, i) => ({ id: t.id, label: t.label, group_id: t.group, color: t.color, sort_order: i }));
  res = await fetch(`${SUPABASE_URL}/rest/v1/tags`, { method: "POST", headers, body: JSON.stringify(tagRows) });
  if (!res.ok) throw new Error(`Теги: ${res.status} ${await res.text()}`);

  console.log(`Перенесено групп: ${groupRows.length}, тегов: ${tagRows.length}`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });