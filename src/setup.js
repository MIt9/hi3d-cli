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

  let accessKey = options.accessKey || options.clientId || process.env.HI3D_ACCESS_KEY || cfg.access_key || cfg.client_id || "";
  let secretKey = options.secretKey || options.clientSecret || process.env.HI3D_SECRET_KEY || cfg.secret_key || cfg.client_secret || "";

  if (isInteractive) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log("Step 1/2. Hi3D API Keys (from https://platform.hi3d.ai/console/apiKey)");
    accessKey = await promptText(rl, "Access Key (ak_...)", accessKey);
    secretKey = await promptText(rl, "Secret Key (sk_...)", secretKey);
    rl.close();
  }

  if (accessKey) {
    cfg.access_key = accessKey;
    cfg.client_id = accessKey;
  }
  if (secretKey) {
    cfg.secret_key = secretKey;
    cfg.client_secret = secretKey;
  }

  let statusText = "keys saved";

  if (accessKey && secretKey) {
    try {
      const client = new Hi3DClient({ accessKey, secretKey });
      const tokRes = await client.fetchToken();
      cfg.token = tokRes.accessToken;
      const balance = await client.getBalance();
      statusText = `verified & active (Balance: ${JSON.stringify(balance)})`;
    } catch (err) {
      statusText = `saved (verification warning: ${err.message})`;
    }
  }

  saveConfig(cfg);

  console.log("\nSetup Summary:");
  console.log(`  Config File: ${CONFIG_PATH}`);
  console.log(`  Access Key:  ${cfg.access_key ? "set" : "not set"}`);
  console.log(`  Secret Key:  ${cfg.secret_key ? "set" : "not set"}`);
  console.log(`  Status:      ${statusText}`);

  console.log("\nStep 2/2. AI Agent Skill hi3d-generate");
  console.log("  To install the skill for AI Agents (Antigravity, Claude, Cursor), run:");
  console.log("    npx -y skills add MIt9/hi3d-skills/hi3d-generate\n");

  return cfg;
}
