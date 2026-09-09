/**
 * Hi3D HTTP Client (Zero runtime dependencies, Node.js >= 18 native fetch/FormData/Blob).
 * Official API Domain: https://api.hitem3d.ai
 */

import fs from "node:fs";
import path from "node:path";
import { BASE_URL, CATEGORY_FORMAT_MAP, ENDPOINTS, FORMAT_MAP } from "./models.js";

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

function guessMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  if (ext === ".glb") return "model/gltf-binary";
  if (ext === ".stl") return "model/stl";
  if (ext === ".obj") return "model/obj";
  return "application/octet-stream";
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
    this.accessKey = options.accessKey || options.clientId || process.env.HI3D_ACCESS_KEY || process.env.HI3D_CLIENT_ID || null;
    this.secretKey = options.secretKey || options.clientSecret || process.env.HI3D_SECRET_KEY || process.env.HI3D_CLIENT_SECRET || null;
    this.token = options.token || process.env.HI3D_API_TOKEN || null;
  }

  /** Gets Access Token via Basic Auth (accessKey:secretKey). */
  async fetchToken() {
    const ak = this.accessKey;
    const sk = this.secretKey;
    if (!ak || !sk) {
      throw new Hi3DError("Both Access Key and Secret Key are required to authenticate.");
    }
    const credentials = Buffer.from(`${ak}:${sk}`).toString("base64");
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

  /** Ensures active JWT token exists, fetching a new token if needed. */
  async ensureToken(forceRefresh = false) {
    if (this.token && !forceRefresh) return this.token;
    if (this.accessKey && this.secretKey) {
      await this.fetchToken();
      return this.token;
    }
    if (this.token) return this.token;
    throw new Hi3DError("Missing Access Key & Secret Key. Run 'hi3d setup' to configure.");
  }

  /** Wrapper for API calls with automatic token refresh on 401. */
  async _authedFetch(url, init = {}) {
    await this.ensureToken();
    init.headers = {
      ...(init.headers || {}),
      Authorization: `Bearer ${this.token}`,
    };

    let resp = await fetch(url, init);
    let data = await resp.json().catch(() => ({}));

    // If token expired (code 401 or 40010000), refresh token once and retry
    if (data.code === 401 || data.code === 40010000 || (data.msg && data.msg.toLowerCase().includes("expired"))) {
      if (this.accessKey && this.secretKey) {
        await this.ensureToken(true);
        init.headers.Authorization = `Bearer ${this.token}`;
        resp = await fetch(url, init);
        data = await resp.json().catch(() => ({}));
      }
    }
    return data;
  }

  /** Queries account credit balance. */
  async getBalance() {
    const data = await this._authedFetch(`${this.baseUrl}${ENDPOINTS.balance}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30_000),
    });

    if (data.code === 200) {
      return data.data ?? data;
    }
    throw new Hi3DError(data.msg || "Failed to query balance", data.code);
  }

  /** Submits 3D model generation task. */
  async submitTask(params = {}) {
    const category = params.category || "image-to-3d";
    const endpoint = ENDPOINTS.submitTask[category] || ENDPOINTS.submitTask["image-to-3d"];

    const form = new FormData();
    const catFmtMap = CATEGORY_FORMAT_MAP[category] || CATEGORY_FORMAT_MAP["image-to-3d"];

    if (category === "relief") {
      // Image to 3D Relief (depth-create-task)
      if (params.model_type || params.model) form.append("model_type", params.model_type || params.model || "pro");
      if (params.height_relief !== undefined) form.append("height_relief", String(params.height_relief));
      if (params.rmbg !== undefined) form.append("rmbg", String(params.rmbg));
      if (params.degree_rmbg !== undefined) form.append("degree_rmbg", String(params.degree_rmbg));
      if (params.shape_base !== undefined) form.append("shape_base", String(params.shape_base));
      if (params.thickness_base !== undefined) form.append("thickness_base", String(params.thickness_base));
      if (params.width !== undefined) form.append("width", String(params.width));
      if (params.sculpmode !== undefined) form.append("sculpmode", String(params.sculpmode));
      form.append("response_format", params.response_format || "url");

      if (params.imagePath) {
        const name = path.basename(params.imagePath);
        const mime = guessMimeType(params.imagePath);
        const fileBuffer = fs.readFileSync(params.imagePath);
        form.append("image", new Blob([fileBuffer], { type: mime }), name);
      } else if (params.image_url || params.imageUrl) {
        form.append("image_url", params.image_url || params.imageUrl);
      }
    } else if (category === "split") {
      // 3D Model Split (split-create-task)
      if (params.model) form.append("model", params.model);
      if (params.part) form.append("part", params.part);
      if (params.joint) form.append("joint", params.joint);
      if (params.merge) form.append("merge", params.merge);
      if (params.level) form.append("level", params.level);

      if (params.meshPath) {
        const name = path.basename(params.meshPath);
        const mime = guessMimeType(params.meshPath);
        const fileBuffer = fs.readFileSync(params.meshPath);
        form.append("mesh", new Blob([fileBuffer], { type: mime }), name);
      } else if (params.mesh_url || params.meshUrl) {
        form.append("mesh_url", params.mesh_url || params.meshUrl);
      }
    } else if (category === "multicolor") {
      // 3D Model Multicolor (multicolor-create-task)
      if (params.model) form.append("model", params.model);
      if (params.number_color !== undefined) form.append("number_color", String(params.number_color));

      if (params.meshPath) {
        const name = path.basename(params.meshPath);
        const mime = guessMimeType(params.meshPath);
        const fileBuffer = fs.readFileSync(params.meshPath);
        form.append("mesh", new Blob([fileBuffer], { type: mime }), name);
      } else if (params.mesh_url || params.meshUrl) {
        form.append("mesh_url", params.mesh_url || params.meshUrl);
      }
    } else {
      // Default: image-to-3d
      form.append("request_type", String(params.request_type ?? 3));
      form.append("model", params.model || "hi3dv3.0");

      if (params.resolution) form.append("resolution", params.resolution);
      if (params.pbr !== undefined) form.append("pbr", String(params.pbr));
      if (params.shading !== undefined) form.append("shading", String(params.shading));
      if (params.face) form.append("face", String(params.face));

      // Single image upload
      if (params.imagePath) {
        const name = path.basename(params.imagePath);
        const mime = guessMimeType(params.imagePath);
        const fileBuffer = fs.readFileSync(params.imagePath);
        form.append("images", new Blob([fileBuffer], { type: mime }), name);
      }

      // Multi images upload
      if (Array.isArray(params.multiImagePaths) && params.multiImagePaths.length > 0) {
        for (const imgPath of params.multiImagePaths) {
          const name = path.basename(imgPath);
          const mime = guessMimeType(imgPath);
          const fileBuffer = fs.readFileSync(imgPath);
          form.append("multi_images", new Blob([fileBuffer], { type: mime }), name);
        }
        if (params.multi_images_bit) {
          form.append("multi_images_bit", params.multi_images_bit);
        }
      }

      // Mesh file / URL for request_type=2
      if (params.mesh_url || params.meshUrl) form.append("mesh_url", params.mesh_url || params.meshUrl);
      if (params.meshPath) {
        const name = path.basename(params.meshPath);
        const mime = guessMimeType(params.meshPath);
        const fileBuffer = fs.readFileSync(params.meshPath);
        form.append("mesh", new Blob([fileBuffer], { type: mime }), name);
      }
    }

    // Common format parameter
    if (params.format !== undefined && params.format !== null) {
      const fmtCode = typeof params.format === "number" ? params.format : (catFmtMap[String(params.format).toLowerCase()] || catFmtMap["glb"] || 2);
      form.append("format", String(fmtCode));
    } else {
      const defaultCode = catFmtMap["glb"] || 2;
      form.append("format", String(defaultCode));
    }

    if (params.callback_url) form.append("callback_url", params.callback_url);

    const data = await this._authedFetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(120_000),
    });

    if (data.code === 200 && data.data?.task_id) {
      return data.data;
    }
    throw new Hi3DError(data.msg || "Failed to submit task", data.code);
  }

  /** Queries status & result of a task. */
  async queryTask(taskId, category = "image-to-3d") {
    const endpoint = ENDPOINTS.queryTask[category] || ENDPOINTS.queryTask["image-to-3d"];
    const url = `${this.baseUrl}${endpoint}?task_id=${encodeURIComponent(taskId)}`;

    const data = await this._authedFetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(30_000),
    });

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
