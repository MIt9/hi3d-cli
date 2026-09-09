/**
 * Hi3D Models & Enum Constants
 * Official API Domain: https://api.hitem3d.ai
 */

export const BASE_URL = "https://api.hitem3d.ai";

export const ENDPOINTS = {
  token: "/open-api/v1/auth/token",
  submitTask: {
    "image-to-3d": "/open-api/v1/submit-task",
    "relief": "/open-api/v1/depth-submit-task",
    "split": "/open-api/v1/split-submit-task",
    "multicolor": "/open-api/v1/multicolor-submit-task",
  },
  queryTask: {
    "image-to-3d": "/open-api/v1/query-task",
    "relief": "/open-api/v1/depth-query-task",
    "split": "/open-api/v1/split-query-task",
    "multicolor": "/open-api/v1/multicolor-query-task",
  },
  balance: "/open-api/v1/balance",
};

export const REQUEST_TYPES = {
  1: "mesh (geometry only)",
  2: "texture (textured model from geometry)",
  3: "both (geometry + texture)",
};

export const FORMAT_MAP = {
  obj: 1,
  glb: 2,
  stl: 3,
  fbx: 4,
  usdz: 5,
  "3mf": 6,
};

export const FORMAT_NAMES = {
  1: "obj",
  2: "glb",
  3: "stl",
  4: "fbx",
  5: "usdz",
  6: "3mf",
};

export const MODELS = [
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
  {
    id: "scene-portraitv2.1",
    name: "Scene Portrait v2.1",
    category: "scene",
    defaultResolution: "1536pro",
    resolutions: ["1536profast", "1536pro"],
    supportsPbr: true,
  },
  {
    id: "scene-portraitv2.0",
    name: "Scene Portrait v2.0",
    category: "scene",
    defaultResolution: "1536pro",
    resolutions: ["1536pro"],
    supportsPbr: true,
  },
  {
    id: "scene-portraitv1.5",
    name: "Scene Portrait v1.5",
    category: "scene",
    defaultResolution: "1536",
    resolutions: ["1536"],
    supportsPbr: false,
  },
];
