/**
 * Hi3D HTTP Client (Zero runtime dependencies, Node.js >= 18 native fetch/FormData/Blob).
 * Official API Domain: https://api.hitem3d.ai
 */

import fs from "node:fs";
import path from "node:path";
import { BASE_URL, ENDPOINTS, FORMAT_MAP } from "./models.js";

export class Hi3DError extends Error {
  constructor(msg, code = null) {
    super(code !== null ? `Hi3D API Error (code=${code}): ${msg}` : `Error: ${msg}`);
    this.name = "Hi3DError";
    this.code = code;
    this.msg = String(msg);
  }
}

export class TaskNotFound extends Hi3DError {
  constructor(msg, code = null) {
    super(msg, code);
    this.name = "TaskNotFound";
  }
}

/** Downloads file from URL to local file path. */
export async function downloadFile(url, destPath) {
  const resp = await fetch(url, { signal: AbortSignal.timeout(300_000) });
  if (!resp.ok) {
    throw new Hi3DError(`Download failed: HTTP ${resp.status} ${resp.statusText}`);
  }
  const dir = path.dirname(destPath);
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const arrayBuffer = await resp.arrayBuffer();
  fs.writeFileSync(destPath, Buffer.from(arrayBuffer));
  return destPath;
}

export class Hi3DClient {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || BASE_URL;
    this.clientId = options.clientId || process.env.HI3D_CLIENT_ID || null;
    this.clientSecret = options.clientSecret || process.env.HI3D_CLIENT_SECRET || null;
    this.token = options.token || process.env.HI3D_API_TOKEN || null;
  }

  /** Gets Access Token via Basic Auth (clientId:clientSecret). */
  async fetchToken(clientId = this.clientId, clientSecret = this.clientSecret) {
    if (!clientId || !clientSecret) {
      throw new Hi3DError("client_id and client_secret are required to fetch access token.");
    }
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const resp = await fetch(`${this.baseUrl}${ENDPOINTS.token}`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    });

    const data = await resp.json().catch(() => ({}));
    if (data.code === 200 && data.data?.accessToken) {
      this.token = data.data.accessToken;
      return data.data;
    }
    throw new Hi3DError(data.msg || data.message || "Failed to obtain token", data.code);
  }

  /** Ensures active token exists. */
  async ensureToken() {
    if (this.token) return this.token;
    if (this.clientId && this.clientSecret) {
      await this.fetchToken();
      return this.token;
    }
    throw new Hi3DError("Missing API token or client credentials. Run 'hi3d setup' or set HI3D_API_TOKEN.");
  }

  /** Queries account credit balance. */
  async getBalance() {
    await this.ensureToken();
    const resp = await fetch(`${this.baseUrl}${ENDPOINTS.balance}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    });

    const data = await resp.json().catch(() => ({}));
    if (data.code === 200) {
      return data.data ?? data;
    }
    throw new Hi3DError(data.msg || "Failed to query balance", data.code);
  }

  /** Submits 3D model generation task. */
  async submitTask(params = {}) {
    await this.ensureToken();
    const category = params.category || "image-to-3d";
    const endpoint = ENDPOINTS.submitTask[category] || ENDPOINTS.submitTask["image-to-3d"];

    const form = new FormData();
    form.append("request_type", String(params.request_type ?? 3));
    form.append("model", params.model || "hi3dv3.0");

    if (params.resolution) form.append("resolution", params.resolution);
    if (params.pbr !== undefined) form.append("pbr", String(params.pbr));
    if (params.shading !== undefined) form.append("shading", String(params.shading));
    if (params.face) form.append("face", String(params.face));

    if (params.format) {
      const fmtCode = typeof params.format === "number" ? params.format : (FORMAT_MAP[String(params.format).toLowerCase()] || 2);
      form.append("format", String(fmtCode));
    } else {
      form.append("format", "2"); // default glb
    }

    if (params.callback_url) form.append("callback_url", params.callback_url);

    // Single image upload
    if (params.imagePath) {
      const name = path.basename(params.imagePath);
      const fileBuffer = fs.readFileSync(params.imagePath);
      form.append("images", new Blob([fileBuffer]), name);
    }

    // Multi images upload
    if (Array.isArray(params.multiImagePaths) && params.multiImagePaths.length > 0) {
      for (const imgPath of params.multiImagePaths) {
        const name = path.basename(imgPath);
        const fileBuffer = fs.readFileSync(imgPath);
        form.append("multi_images", new Blob([fileBuffer]), name);
      }
      if (params.multi_images_bit) {
        form.append("multi_images_bit", params.multi_images_bit);
      }
    }

    // Mesh file / URL for request_type=2
    if (params.mesh_url) form.append("mesh_url", params.mesh_url);
    if (params.meshPath) {
      const name = path.basename(params.meshPath);
      const fileBuffer = fs.readFileSync(params.meshPath);
      form.append("mesh", new Blob([fileBuffer]), name);
    }

    const resp = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
      body: form,
      signal: AbortSignal.timeout(120_000),
    });

    const data = await resp.json().catch(() => ({}));
    if (data.code === 200 && data.data?.task_id) {
      return data.data;
    }
    throw new Hi3DError(data.msg || "Failed to submit task", data.code);
  }

  /** Queries status & result of a task. */
  async queryTask(taskId, category = "image-to-3d") {
    await this.ensureToken();
    const endpoint = ENDPOINTS.queryTask[category] || ENDPOINTS.queryTask["image-to-3d"];
    const url = `${this.baseUrl}${endpoint}?task_id=${encodeURIComponent(taskId)}`;

    const resp = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.token}`,
        "Content-Type": "application/json",
      },
      signal: AbortSignal.timeout(30_000),
    });

    const data = await resp.json().catch(() => ({}));
    if (data.code === 200) {
      return data.data;
    }
    if (data.code === 404 || (data.msg && data.msg.toLowerCase().includes("not found"))) {
      throw new TaskNotFound(data.msg || "Task not found", data.code);
    }
    throw new Hi3DError(data.msg || "Failed to query task", data.code);
  }

  /** Waits for task completion polling. */
  async waitForTask(taskId, options = {}) {
    const pollInterval = options.pollInterval || 3000;
    const timeout = options.timeout || 600_000;
    const startTime = Date.now();
    const category = options.category || "image-to-3d";

    while (Date.now() - startTime < timeout) {
      const res = await this.queryTask(taskId, category);
      const state = (res.state || "").toLowerCase();
      if (state === "success") {
        return res;
      }
      if (state === "failed") {
        throw new Hi3DError(`Task failed: ${res.msg || "3D generation failed"}`);
      }
      await new Promise((r) => setTimeout(r, pollInterval));
    }
    throw new Hi3DError(`Task ${taskId} timed out after ${Math.round(timeout / 1000)}s`);
  }
}
