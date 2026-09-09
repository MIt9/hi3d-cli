/**
 * Hi3D CLI — Node.js CLI tool for generating 3D models (GLB, OBJ, STL, FBX, USDZ, 3MF) via Hi3D API (api.hitem3d.ai).
 * Argument parser hand-rolled with zero runtime dependencies.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { Hi3DClient, Hi3DError, downloadFile } from "./client.js";
import { FORMAT_MAP, FORMAT_NAMES, MODELS, REQUEST_TYPES } from "./models.js";
import { CONFIG_PATH, loadConfig, runSetup, saveConfig } from "./setup.js";

export const VERSION = "0.1.3";

export class UsageError extends Error {
  constructor(msg) {
    super(msg);
    this.name = "UsageError";
  }
}

/** Lightweight argument parser. */
export function parseArgs(argv, spec = {}) {
  const bools = new Set(spec.bool || []);
  const values = new Set(spec.value || []);
  const multis = new Set(spec.multi || []);
  const alias = spec.alias || {};
  const flags = {};
  const positionals = [];

  for (let i = 0; i < argv.length; i++) {
    let arg = alias[argv[i]] || argv[i];
    if (arg === "--") {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    if (arg.startsWith("--")) {
      const eqIdx = arg.indexOf("=");
      if (eqIdx !== -1) {
        const flag = arg.slice(0, eqIdx);
        const val = arg.slice(eqIdx + 1);
        if (multis.has(flag)) {
          flags[flag] = flags[flag] || [];
          flags[flag].push(val);
        } else {
          flags[flag] = val;
        }
      } else if (bools.has(arg)) {
        flags[arg] = true;
      } else if (values.has(arg)) {
        const val = argv[++i];
        if (val === undefined) throw new UsageError(`Flag ${arg} requires a value`);
        flags[arg] = val;
      } else if (multis.has(arg)) {
        const val = argv[++i];
        if (val === undefined) throw new UsageError(`Flag ${arg} requires a value`);
        flags[arg] = flags[arg] || [];
        flags[arg].push(val);
      } else {
        flags[arg] = true;
      }
    } else if (arg.startsWith("-")) {
      if (bools.has(arg)) {
        flags[arg] = true;
      } else if (values.has(arg)) {
        const val = argv[++i];
        if (val === undefined) throw new UsageError(`Flag ${arg} requires a value`);
        flags[arg] = val;
      } else {
        flags[arg] = true;
      }
    } else {
      positionals.push(arg);
    }
  }

  return { flags, positionals };
}

export function printHelp() {
  console.log(`
📐 Hi3D CLI v${VERSION} — 3D Model Generation CLI (api.hitem3d.ai)

USAGE:
  hi3d <command> [subcommand] [options]

COMMANDS:
  setup                            Interactive setup wizard for Access Key, Secret Key, and Agent skill
  config                           View or set CLI configuration (e.g. hi3d config --set-access-key AK --set-secret-key SK)
  token                            Obtain or refresh JWT access token
  balance | credits                Check account credit balance
  models                           List supported Hi3D models & resolutions
  run | generate <category>       Submit 3D generation task
  status | query <task_id>        Query status of a 3D generation task

CATEGORIES (for run/generate):
  image-to-3d                      Generate 3D model from single or multi-view image (default)
  relief                           Generate 3D relief / depth model
  split                            Split 3D model into parts
  multicolor                       Generate 3D multicolor model

OPTIONS:
  --access-key <key>               Hi3D Access Key (ak_...)
  --secret-key <key>               Hi3D Secret Key (sk_...)
  --image <path>                   Input single image file
  --multi-images <path1,path2>     Input multiple view image files (up to 4)
  --multi-images-bit <bit>         Bitmap string for multi_images (e.g. 1010)
  --model <model_id>               Model version (default: hi3dv3.0)
  --request-type <1|2|3>           1: mesh, 2: texture, 3: both (default: 3)
  --format <obj|glb|stl|fbx|usdz|3mf> Output 3D format (default: glb)
  --resolution <tier>              Resolution (e.g. 2048quality, 2048master)
  --pbr <0|1>                      PBR texture switch (default: 1)
  --face <count>                   Face count (100000..5000000)
  --shading <float>                De-shading strength (0.0..1.0, default 0.5)
  --wait                           Wait for task completion
  --download <dir>                 Directory to download generated 3D files
  --dry-run                        Validate inputs without sending request
  --json                           Output JSON format
  -h, --help                       Show help
  -v, --version                    Show version

EXAMPLES:
  hi3d setup
  hi3d config --set-access-key ak_c8ef... --set-secret-key sk_...
  hi3d balance
  hi3d run image-to-3d --image ./chair.png --format obj --wait --download ./models
  hi3d run relief --image ./portrait.png --resolution 1536pro --wait
`);
}

export async function main(argv = process.argv.slice(2)) {
  const spec = {
    bool: ["--help", "-h", "--version", "-v", "--wait", "--dry-run", "--json", "--yes"],
    value: [
      "--access-key",
      "--secret-key",
      "--set-access-key",
      "--set-secret-key",
      "--api-key",
      "--set-key",
      "--image",
      "--multi-images",
      "--multi-images-bit",
      "--model",
      "--request-type",
      "--format",
      "--resolution",
      "--pbr",
      "--face",
      "--shading",
      "--download",
      "--client-id",
      "--client-secret",
      "--token",
      "--category",
    ],
    alias: {
      "-h": "--help",
      "-v": "--version",
      "-ak": "--access-key",
      "-sk": "--secret-key",
      "-i": "--image",
      "-m": "--model",
      "-f": "--format",
      "-o": "--download",
      "-w": "--wait",
    },
  };

  const { flags, positionals } = parseArgs(argv, spec);

  if (flags["--version"]) {
    console.log(`hi3d-cli v${VERSION}`);
    return;
  }

  if (flags["--help"] || positionals.length === 0) {
    printHelp();
    return;
  }

  const cmd = positionals[0].toLowerCase();
  const subCmd = positionals[1] ? positionals[1].toLowerCase() : null;

  // Load config & client
  const cfg = loadConfig();
  const accessKey = flags["--access-key"] || flags["--set-access-key"] || flags["--client-id"] || cfg.access_key || cfg.client_id;
  const secretKey = flags["--secret-key"] || flags["--set-secret-key"] || flags["--client-secret"] || cfg.secret_key || cfg.client_secret;
  const token = flags["--token"] || cfg.token;

  const clientOptions = {
    accessKey,
    secretKey,
    token,
  };
  const client = new Hi3DClient(clientOptions);

  switch (cmd) {
    case "setup": {
      await runSetup({
        yes: flags["--yes"],
        accessKey: flags["--access-key"] || flags["--set-access-key"],
        secretKey: flags["--secret-key"] || flags["--set-secret-key"],
        clientId: flags["--client-id"],
        clientSecret: flags["--client-secret"],
        token: flags["--token"],
      });
      break;
    }

    case "config": {
      if (flags["--set-access-key"] || flags["--access-key"]) {
        const ak = flags["--set-access-key"] || flags["--access-key"];
        cfg.access_key = ak;
        cfg.client_id = ak;
      }
      if (flags["--set-secret-key"] || flags["--secret-key"]) {
        const sk = flags["--set-secret-key"] || flags["--secret-key"];
        cfg.secret_key = sk;
        cfg.client_secret = sk;
      }

      if (flags["--set-access-key"] || flags["--access-key"] || flags["--set-secret-key"] || flags["--secret-key"]) {
        saveConfig(cfg);
        console.log("Configuration updated.");
      } else {
        console.log(JSON.stringify(cfg, null, 2));
      }
      break;
    }

    case "token": {
      const tokenInfo = await client.fetchToken();
      cfg.token = tokenInfo.accessToken;
      saveConfig(cfg);
      if (flags["--json"]) {
        console.log(JSON.stringify(tokenInfo, null, 2));
      } else {
        console.log(`Access Token acquired successfully:\n  ${tokenInfo.accessToken}`);
      }
      break;
    }

    case "balance":
    case "credits": {
      const balance = await client.getBalance();
      if (flags["--json"]) {
        console.log(JSON.stringify(balance, null, 2));
      } else {
        console.log(`Account Balance:`, balance);
      }
      break;
    }

    case "models": {
      if (flags["--json"]) {
        console.log(JSON.stringify({ models: MODELS, formats: FORMAT_MAP, request_types: REQUEST_TYPES }, null, 2));
      } else {
        console.log("\n📐 Supported Hi3D Models:\n");
        for (const m of MODELS) {
          console.log(`  • ${m.id} (${m.name}) [Category: ${m.category}]`);
          console.log(`    Resolutions: ${m.resolutions.join(", ")} (Default: ${m.defaultResolution})`);
          console.log(`    PBR Support: ${m.supportsPbr ? "Yes" : "No"}`);
        }
        console.log("\nSupported Output Formats:", Object.keys(FORMAT_MAP).join(", "));
        console.log("Request Types: 1=mesh, 2=texture, 3=both\n");
      }
      break;
    }

    case "run":
    case "generate": {
      const category = subCmd || flags["--category"] || "image-to-3d";
      const imagePath = flags["--image"] || positionals[2];
      const multiImagesRaw = flags["--multi-images"];

      let multiImagePaths = null;
      if (multiImagesRaw) {
        multiImagePaths = multiImagesRaw.split(",").map((s) => s.trim());
      }

      if (!imagePath && (!multiImagePaths || multiImagePaths.length === 0)) {
        throw new UsageError("Error: --image <path> or --multi-images <path1,path2> is required.");
      }

      const params = {
        category,
        model: flags["--model"] || "hi3dv3.0",
        request_type: flags["--request-type"] ? parseInt(flags["--request-type"], 10) : 3,
        format: flags["--format"] || "glb",
        resolution: flags["--resolution"],
        pbr: flags["--pbr"] !== undefined ? parseInt(flags["--pbr"], 10) : undefined,
        shading: flags["--shading"] !== undefined ? parseFloat(flags["--shading"]) : undefined,
        face: flags["--face"] ? parseInt(flags["--face"], 10) : undefined,
        multi_images_bit: flags["--multi-images-bit"],
        imagePath,
        multiImagePaths,
      };

      if (flags["--dry-run"]) {
        console.log(`Hi3D (${category}) — Request not sent (--dry-run):`);
        console.log(JSON.stringify(params, null, 2));
        return;
      }

      console.log(`Submitting Hi3D (${category}) task...`);
      const result = await client.submitTask(params);
      const taskId = result.task_id;

      if (flags["--json"]) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`Task submitted successfully!\n  Task ID: ${taskId}`);
      }

      if (flags["--wait"] || flags["--download"]) {
        console.log(`Waiting for 3D model generation...`);
        const status = await client.waitForTask(taskId, { category });
        console.log(`State: ${status.state}`);

        if (status.url && flags["--download"]) {
          const outDir = flags["--download"] === true ? "./out" : flags["--download"];
          const fmtName = FORMAT_NAMES[params.format] || params.format || "glb";
          const outPath = path.join(outDir, `hi3d-${taskId}.${fmtName}`);
          console.log(`Downloading 3D model to ${outPath}...`);
          await downloadFile(status.url, outPath);
          console.log(`Saved: ${outPath}`);
        } else if (status.url) {
          console.log(`3D Model URL: ${status.url}`);
        }
      }
      break;
    }

    case "status":
    case "query": {
      const taskId = subCmd || positionals[2];
      if (!taskId) throw new UsageError("Task ID is required for status check.");
      const category = flags["--category"] || "image-to-3d";
      const res = await client.queryTask(taskId, category);

      if (flags["--json"]) {
        console.log(JSON.stringify(res, null, 2));
      } else {
        console.log(`Task ID: ${res.task_id}`);
        console.log(`State:   ${res.state}`);
        if (res.url) console.log(`3D Model URL: ${res.url}`);
        if (res.cover_url) console.log(`Cover Image:  ${res.cover_url}`);
      }

      if (res.url && flags["--download"]) {
        const outDir = flags["--download"] === true ? "./out" : flags["--download"];
        const outPath = path.join(outDir, `hi3d-${taskId}.glb`);
        console.log(`Downloading 3D model to ${outPath}...`);
        await downloadFile(res.url, outPath);
        console.log(`Saved: ${outPath}`);
      }
      break;
    }

    default: {
      throw new UsageError(`Unknown command: ${cmd}`);
    }
  }
}
