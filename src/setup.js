/**
 * Interactive & non-interactive setup wizard for Hi3D CLI.
 * Config location: ~/.hi3d/config.json
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import readline from "node:readline";
import { Hi3DClient } from "./client.js";

export const CONFIG_DIR = path.join(os.homedir(), ".hi3d");
export const CONFIG_PATH = path.join(CONFIG_DIR, "config.json");

/** Loads config from ~/.hi3d/config.json. */
export function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    const raw = fs.readFileSync(CONFIG_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Saves config to ~/.hi3d/config.json with chmod 600. */
export function saveConfig(cfg) {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 });
  }
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2), { mode: 0o600 });
}

function promptText(rl, question, defaultValue = "") {
  return new Promise((resolve) => {
    const prompt = defaultValue ? `${question} [${defaultValue}]: ` : `${question}: `;
    rl.question(prompt, (answer) => {
      resolve(answer.trim() || defaultValue);
    });
  });
}

export async function runSetup(options = {}) {
  console.log("\n📐 Hi3D CLI — Setup Wizard\n");
  const isInteractive = Boolean(process.stdin.isTTY) && !options.yes;
  const cfg = loadConfig();

  let clientId = options.clientId || process.env.HI3D_CLIENT_ID || cfg.client_id || "";
  let clientSecret = options.clientSecret || process.env.HI3D_CLIENT_SECRET || cfg.client_secret || "";
  let token = options.token || process.env.HI3D_API_TOKEN || cfg.token || "";

  if (isInteractive) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log("Step 1/2. Hi3D API Credentials (from https://hi3d.ai)");
    clientId = await promptText(rl, "Client ID", clientId);
    clientSecret = await promptText(rl, "Client Secret", clientSecret);
    if (!clientId && !clientSecret) {
      token = await promptText(rl, "Direct Access Token (optional if ID/Secret set)", token);
    }
    rl.close();
  }

  if (clientId) cfg.client_id = clientId;
  if (clientSecret) cfg.client_secret = clientSecret;
  if (token) cfg.token = token;

  let balanceInfo = "not verified";
  let tokenStatus = "missing";

  if (clientId && clientSecret) {
    try {
      const client = new Hi3DClient({ clientId, clientSecret });
      const tokRes = await client.fetchToken();
      cfg.token = tokRes.accessToken;
      tokenStatus = "verified & saved";
    } catch (err) {
      console.warn(`⚠️ Could not verify token: ${err.message}`);
    }
  } else if (token) {
    tokenStatus = "token provided";
  }

  saveConfig(cfg);

  console.log("\nSetup Summary:");
  console.log(`  Config File:   ${CONFIG_PATH}`);
  console.log(`  Client ID:     ${cfg.client_id ? "set" : "not set"}`);
  console.log(`  Client Secret: ${cfg.client_secret ? "set" : "not set"}`);
  console.log(`  Token Status:  ${tokenStatus}`);

  console.log("\nStep 2/2. AI Agent Skill hi3d-generate");
  console.log("  To install the skill for AI Agents (Antigravity, Claude, Cursor), run:");
  console.log("    npx -y skills add MIt9/hi3d-skills/hi3d-generate\n");

  return cfg;
}
