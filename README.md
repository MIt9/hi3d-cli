# Hi3D CLI (`hi3d`) & Agent Skill

A Node.js CLI tool and AI Agent Skill for generating **3D models (GLB, OBJ, STL, FBX, USDZ, 3MF)** via the [Hi3D API](https://docs.hi3d.ai) (`https://api.hitem3d.ai`).

Supports single & multi-view image-to-3D, 3D relief generation, model splitting, and multicolor 3D mesh creation.

**Zero runtime dependencies** — requires only Node.js >= 18.

---

## 🚀 Quick Start & Setup

The executable command is **`hi3d`**:

```bash
npx -y hi3d-cli setup
```

The interactive setup wizard guides you through:
1. **Hi3D API Credentials** — Client ID & Client Secret or direct Access Token from [https://hi3d.ai](https://hi3d.ai), saving to `~/.hi3d/config.json`.
2. **AI Agent Skill** — offers installation of `hi3d-generate` skill via `npx -y skills add MIt9/hi3d-skills/hi3d-generate`.

---

## 🔑 Setting API Credentials

Get your API credentials at [https://hi3d.ai](https://hi3d.ai).

Set credentials via CLI or Environment Variables:

```bash
# Option 1: Interactive Wizard
hi3d setup

# Option 2: Config command
hi3d config --set-client-id YOUR_CLIENT_ID --set-client-secret YOUR_CLIENT_SECRET

# Option 3: Environment Variables
export HI3D_CLIENT_ID=YOUR_CLIENT_ID
export HI3D_CLIENT_SECRET=YOUR_CLIENT_SECRET
# or
export HI3D_API_TOKEN=YOUR_ACCESS_TOKEN
```

Verify balance:
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

### 4. Query Task & Download
```bash
hi3d status <task_id> --download ./models
```

---

## 🤖 AI Agent Skill Integration

Include the `hi3d-generate` skill in your agent workspace (`skills/hi3d-generate/SKILL.md`) to enable AI agents (Antigravity, Cursor, Claude) to convert photos to 3D models using natural language!
