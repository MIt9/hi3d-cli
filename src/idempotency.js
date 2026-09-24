/**
 * Idempotency / Task Recovery for Hi3D CLI
 * Prevents duplicate paid generations when connection drops after server accepts task
 * but before CLI receives task_id.
 *
 * Cache: ~/.hi3d/task-cache.json
 * Key: sha256 of stable JSON of relevant params + image/mesh file content hashes
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

export const CACHE_DIR = path.join(os.homedir(), ".hi3d");
export const CACHE_PATH = path.join(CACHE_DIR, "task-cache.json");
// Keep entries for 24h, guard window 10m for recovery, 5m for pending
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const RECOVER_WINDOW_MS = 10 * 60 * 1000;
export const PENDING_WINDOW_MS = 5 * 60 * 1000;

function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true, mode: 0o700 });
  }
}

export function loadCache() {
  try {
    if (!fs.existsSync(CACHE_PATH)) return [];
    const raw = fs.readFileSync(CACHE_PATH, "utf8");
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    // filter expired
    const now = Date.now();
    return arr.filter((e) => e.timestamp && now - e.timestamp < CACHE_TTL_MS);
  } catch {
    return [];
  }
}

export function saveCache(entries) {
  ensureCacheDir();
  // keep only recent 50 entries to avoid bloat
  const trimmed = entries.slice(-50);
  fs.writeFileSync(CACHE_PATH, JSON.stringify(trimmed, null, 2), { mode: 0o600 });
}

function hashFile(filePath) {
  try {
    const data = fs.readFileSync(filePath);
    return crypto.createHash("sha256").update(data).digest("hex").slice(0, 16);
  } catch {
    // if file not readable, hash the path string itself
    return crypto.createHash("sha256").update(String(filePath)).digest("hex").slice(0, 16);
  }
}

/**
 * Compute stable idempotency key from params.
 * Includes: category, model, format, resolution, pbr, etc + file content hashes
 */
export function computeIdempotencyKey(params = {}) {
  const parts = {
    category: params.category || "image-to-3d",
    model: params.model || "",
    format: String(params.format || ""),
    resolution: params.resolution || "",
    request_type: params.request_type ?? "",
    pbr: params.pbr ?? "",
    // relief
    height_relief: params.height_relief ?? "",
    rmbg: params.rmbg ?? "",
    // split/multicolor
    part: params.part || "",
    joint: params.joint || "",
    level: params.level || "",
    number_color: params.number_color ?? "",
    // file hashes (not raw paths, to detect same content even if renamed)
    imageHash: params.imagePath ? hashFile(params.imagePath) : params.imageUrl || params.image_url || "",
    multiImageHashes: Array.isArray(params.multiImagePaths)
      ? params.multiImagePaths.map(hashFile).sort().join(",")
      : "",
    multiImagesBit: params.multi_images_bit || "",
    meshHash: params.meshPath ? hashFile(params.meshPath) : params.meshUrl || params.mesh_url || "",
  };
  const stable = JSON.stringify(parts, Object.keys(parts).sort());
  return crypto.createHash("sha256").update(stable).digest("hex").slice(0, 32);
}

export function findRecentEntry(key, windowMs = RECOVER_WINDOW_MS) {
  const cache = loadCache();
  const now = Date.now();
  // find most recent matching key within window
  for (let i = cache.length - 1; i >= 0; i--) {
    const e = cache[i];
    if (e.key === key && now - e.timestamp < windowMs) {
      return e;
    }
  }
  return null;
}

export function findEntryByKey(key) {
  const cache = loadCache();
  for (let i = cache.length - 1; i >= 0; i--) {
    if (cache[i].key === key) return cache[i];
  }
  return null;
}

export function createPendingEntry(key, params) {
  const cache = loadCache();
  const entry = {
    key,
    params_summary: {
      category: params.category,
      model: params.model,
      format: params.format,
      imagePath: params.imagePath ? path.basename(params.imagePath) : undefined,
      imageUrl: params.imageUrl || params.image_url,
      meshPath: params.meshPath ? path.basename(params.meshPath) : undefined,
    },
    task_id: null,
    state: "pending",
    timestamp: Date.now(),
  };
  cache.push(entry);
  saveCache(cache);
  return entry;
}

export function updateEntryWithTaskId(key, taskId, state = "submitted") {
  const cache = loadCache();
  // find pending entry for this key (most recent pending without task_id)
  for (let i = cache.length - 1; i >= 0; i--) {
    if (cache[i].key === key && !cache[i].task_id) {
      cache[i].task_id = taskId;
      cache[i].state = state;
      cache[i].timestamp = Date.now();
      saveCache(cache);
      return cache[i];
    }
  }
  // if no pending, create new entry directly with task_id
  const entry = {
    key,
    params_summary: {},
    task_id: taskId,
    state,
    timestamp: Date.now(),
  };
  cache.push(entry);
  saveCache(cache);
  return entry;
}

export function markEntryFailed(key, errorMsg) {
  const cache = loadCache();
  for (let i = cache.length - 1; i >= 0; i--) {
    if (cache[i].key === key && cache[i].state === "pending" && !cache[i].task_id) {
      cache[i].state = "failed";
      cache[i].error = String(errorMsg).slice(0, 500);
      cache[i].timestamp = Date.now();
      saveCache(cache);
      return cache[i];
    }
  }
  return null;
}

export function removePendingEntry(key) {
  const cache = loadCache();
  const filtered = cache.filter((e) => !(e.key === key && e.state === "pending" && !e.task_id));
  if (filtered.length !== cache.length) {
    saveCache(filtered);
    return true;
  }
  return false;
}

export function clearCache() {
  if (fs.existsSync(CACHE_PATH)) fs.unlinkSync(CACHE_PATH);
}
