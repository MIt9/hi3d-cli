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

  let apiKey = options.apiKey || options.token || process.env.HI3D_API_KEY || process.env.HI3D_API_TOKEN || cfg.api_key || cfg.token || "";

  if (isInteractive) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log("Step 1/2. Hi3D API Key (Get your key at https://hi3d.ai)");
    apiKey = await promptText(rl, "Hi3D API Key", apiKey);
    rl.close();
  }

  if (apiKey) {
    cfg.api_key = apiKey;
    cfg.token = apiKey;
  }

  let statusText = "key saved";

  if (apiKey) {
    try {
      const client = new Hi3DClient({ apiKey });
      const balance = await client.getBalance();
      statusText = `verified (Balance: ${JSON.stringify(balance)})`;
    } catch (err) {
      statusText = `saved (verification warning: ${err.message})`;
    }
  }

  saveConfig(cfg);

  console.log("\nSetup Summary:");
  console.log(`  Config File: ${CONFIG_PATH}`);
  console.log(`  API Key:     ${cfg.api_key ? "set" : "not set"}`);
  console.log(`  Status:      ${statusText}`);

  console.log("\nStep 2/2. AI Agent Skill hi3d-generate");
  console.log("  To install the skill for AI Agents (Antigravity, Claude, Cursor), run:");
  console.log("    npx -y skills add MIt9/hi3d-skills/hi3d-generate\n");

  return cfg;
}
