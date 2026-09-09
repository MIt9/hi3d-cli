```
  _  _ _ _____  ___    ____ _     ___
 | || (_)___ / |  _ \  / ___| |   |_ _|
 | || | | |_ \ | | | || |   | |    | |
 | || | |___) || |_| || |___| |___ | |
 |_||_|_|____/ |____/  \____|_____|___|
```

# Hi3D CLI (`hi3d`)

[![npm](https://img.shields.io/npm/v/hi3d-cli.svg)](https://www.npmjs.com/package/hi3d-cli)
[![node](https://img.shields.io/node/v/hi3d-cli.svg)](https://nodejs.org)
[![license](https://img.shields.io/npm/l/hi3d-cli.svg)](LICENSE)

A lightweight Node.js CLI tool and AI Agent Skill for generating **3D models (GLB, OBJ, STL, FBX, USDZ, 3MF)** via the [Hi3D API](https://docs.hi3d.ai) (`https://api.hitem3d.ai`).

Supports single & multi-view image-to-3D, 3D relief generation, model splitting, and multicolor 3D mesh creation.

**Zero runtime dependencies** — requires only Node.js >= 18.

---

## 🚀 Quick Start & Setup

The executable command is **`hi3d`**:

```bash
npx -y hi3d-cli setup
```

The interactive setup wizard guides you through:
1. **Hi3D API Keys** — Access Key (`ak_...`) & Secret Key (`sk_...`) from [https://platform.hi3d.ai/console/apiKey](https://platform.hi3d.ai/console/apiKey), saved to `~/.hi3d/config.json`.
2. **AI Agent Skill** — offers installation of `hi3d-generate` skill via `npx -y skills add MIt9/hi3d-skills/hi3d-generate`.

---

## 🔑 Setting API Credentials

Get your API credentials from the [Hi3D Console](https://platform.hi3d.ai/console/apiKey).

Set credentials via CLI or Environment Variables:

```bash
# Option 1: Interactive Wizard
hi3d setup

# Option 2: Config command
hi3d config --set-access-key ak_... --set-secret-key sk_...

# Option 3: Environment Variables
export HI3D_ACCESS_KEY=ak_...
export HI3D_SECRET_KEY=sk_...
```

Verify account balance:
```bash
hi3d balance
```

---

## 📐 Usage & Examples

### 1. Single Image to 3D
```bash
hi3d run image-to-3d \
  --image ./chair.png \
  --model hi3dv3.0 \
  --format obj \
  --resolution 2048quality \
  --wait \
  --download ./output
```

### 2. Multi-View Image to 3D
```bash
hi3d run image-to-3d \
  --multi-images ./front.jpg,./left.jpg \
  --multi-images-bit 1010 \
  --format stl \
  --wait \
  --download ./models
```

### 3. Image to 3D Relief
```bash
hi3d run relief \
  --image ./portrait.png \
  --resolution 1536pro \
  --wait \
  --download ./reliefs
```

### 4. Query Task Status & Download
```bash
hi3d status <task_id> --download ./models
```

---

## 🎨 Supported 3D Formats & Models

### Formats (`--format`):
- `glb` (Default)
- `obj`
- `stl` (3D printing)
- `fbx`
- `usdz` (AR / iOS)
- `3mf` (Multi-color 3D printing)

### Models (`--model`):
- `hi3dv3.0` (Default, Resolutions: `2048quality`, `2048master`, PBR)
- `hitem3dv2.1` (Resolutions: `1536fast`, `1536pro`, PBR)
- `hitem3dv2.0` (Resolutions: `1536`, `1536pro`, PBR)
- `hitem3dv1.5` (Resolutions: `512`, `1024`, `1536`, `1536pro`)
- `scene-portraitv2.1` (Scene/Portrait model)

---

## 🤖 AI Agent Skill Integration

Install the `hi3d-generate` skill into your AI Agent environment (Antigravity, Cursor, Claude, etc.):

```bash
npx -y skills add MIt9/hi3d-skills/hi3d-generate
```

This enables AI coding agents to convert photos to 3D models using natural language!
