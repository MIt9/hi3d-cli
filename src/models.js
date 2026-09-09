/**
 * Hi3D Models, Enum Constants, and Capabilities
 * Official API Domain: https://api.hitem3d.ai
 */

export const BASE_URL = "https://api.hitem3d.ai";

export const ENDPOINTS = {
  token: "/open-api/v1/auth/token",
  submitTask: {
    "image-to-3d": "/open-api/v1/submit-task",
    "relief": "/open-api/v1/depth/create-task",
    "split": "/open-api/v1/split/create-task",
    "multicolor": "/open-api/v1/muilticolor/create-task",
  },
  queryTask: {
    "image-to-3d": "/open-api/v1/query-task",
    "relief": "/open-api/v1/depth/query-task",
    "split": "/open-api/v1/split/query-task",
    "multicolor": "/open-api/v1/muilticolor/query-task",
  },
  balance: "/open-api/v1/balance",
};

export const REQUEST_TYPES = {
  1: "mesh (geometry only)",
  2: "texture (staged: texture based on existing geometry)",
  3: "both (all-in-one: geometry + texture)",
};

/** Category-specific format integer mappings as defined in Hi3D API docs */
export const CATEGORY_FORMAT_MAP = {
  "image-to-3d": { obj: 1, glb: 2, stl: 3, fbx: 4, usdz: 5, "3mf": 6 },
  "relief": { exr: 1, png: 2, stl: 3, glb: 4, "3mf": 5, bmp: 6 },
  "split": { obj: 1, glb: 2, stl: 3, fbx: 4, usdz: 5, "3mf": 6 },
  "multicolor": { obj: 1, glb: 2, fbx: 4, "3mf": 6 },
};

export const CATEGORY_FORMAT_NAMES = {
  "image-to-3d": { 1: "obj", 2: "glb", 3: "stl", 4: "fbx", 5: "usdz", 6: "3mf" },
  "relief": { 1: "exr", 2: "png", 3: "stl", 4: "glb", 5: "3mf", 6: "bmp" },
  "split": { 1: "obj", 2: "glb", 3: "stl", 4: "fbx", 5: "usdz", 6: "3mf" },
  "multicolor": { 1: "obj", 2: "glb", 4: "fbx", 6: "3mf" },
};

export const FORMAT_MAP = CATEGORY_FORMAT_MAP["image-to-3d"];
export const FORMAT_NAMES = CATEGORY_FORMAT_NAMES["image-to-3d"];

export const CATEGORY_FORMATS = {
  "image-to-3d": ["obj", "glb", "stl", "fbx", "usdz", "3mf"],
  "relief": ["exr", "png", "stl", "glb", "3mf", "bmp"],
  "split": ["obj", "glb", "stl", "fbx", "usdz", "3mf"],
  "multicolor": ["obj", "glb", "fbx", "3mf"],
};

export const MODELS = [
  // General Models
  {
    id: "hi3dv3.0",
    name: "Hi3D v3.0",
    category: "general",
    defaultResolution: "2048quality",
    resolutions: ["2048quality", "2048master"],
    supportsPbr: true,
  },
  {
    id: "hitem3dv2.1",
    name: "Hitem3D v2.1",
    category: "general",
    defaultResolution: "1536pro",
    resolutions: ["1536fast", "1536pro"],
    supportsPbr: true,
  },
  {
    id: "hitem3dv2.0",
    name: "Hitem3D v2.0",
    category: "general",
    defaultResolution: "1536pro",
    resolutions: ["1536", "1536pro"],
    supportsPbr: true,
  },
  {
    id: "hitem3dv1.5",
    name: "Hitem3D v1.5",
    category: "general",
    defaultResolution: "1024",
    resolutions: ["512", "1024", "1536", "1536pro"],
    supportsPbr: false,
  },

  // Portrait Models
  {
    id: "scene-portraitv2.1",
    name: "Scene Portrait v2.1",
    category: "portrait",
    defaultResolution: "1536pro",
    resolutions: ["1536profast", "1536pro"],
    supportsPbr: true,
  },
  {
    id: "scene-portraitv2.0",
    name: "Scene Portrait v2.0",
    category: "portrait",
    defaultResolution: "1536pro",
    resolutions: ["1536pro"],
    supportsPbr: true,
  },
  {
    id: "scene-portraitv1.5",
    name: "Scene Portrait v1.5",
    category: "portrait",
    defaultResolution: "1536",
    resolutions: ["1536"],
    supportsPbr: false,
  },

  // Depth Map / Relief Models
  {
    id: "pro",
    name: "Depth Map Model (Pro)",
    category: "relief",
    defaultResolution: "Pro",
    resolutions: ["Base", "Pro"],
    supportsPbr: false,
  },
  {
    id: "base",
    name: "Depth Map Model (Base)",
    category: "relief",
    defaultResolution: "Base",
    resolutions: ["Base", "Pro"],
    supportsPbr: false,
  },

  // Split Models
  {
    id: "character",
    name: "Split Model (Character)",
    category: "split",
    defaultResolution: "default",
    resolutions: ["default"],
    supportsPbr: false,
  },
  {
    id: "general",
    name: "Split Model (General)",
    category: "split",
    defaultResolution: "default",
    resolutions: ["default"],
    supportsPbr: false,
  },

  // Multicolor Models
  {
    id: "multicolor",
    name: "Multicolor Model",
    category: "multicolor",
    defaultResolution: "default",
    resolutions: ["default"],
    supportsPbr: false,
  },
];
