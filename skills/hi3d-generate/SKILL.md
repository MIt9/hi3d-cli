---
name: hi3d-generate
description: Generate 3D models (GLB, OBJ, STL, FBX, USDZ, 3MF) from images, reliefs, model splitting, and multicolor using Hi3D API via hi3d CLI. Use whenever the user wants to convert photos or images into 3D models, generate 3D reliefs, split 3D models, or manage Hi3D generation tasks.
---

# Hi3D 3D Model Generation Skill (`hi3d-generate`)

This skill enables AI agents to generate 3D models, reliefs, and multi-color 3D objects using the **Hi3D API** (`https://api.hitem3d.ai`) via the lightweight `hi3d` CLI.

---

## 1. Prerequisites & Credentials

Hi3D requires Client Credentials (`client_id` and `client_secret`) or a direct Access Token (`token`) from [https://hi3d.ai](https://hi3d.ai).

### Configuration Options:
1. **Interactive / Non-interactive Setup**:
   ```bash
   hi3d setup --yes --client-id YOUR_CLIENT_ID --client-secret YOUR_CLIENT_SECRET
   ```
2. **CLI Config Command**:
   ```bash
   hi3d config --set-client-id YOUR_CLIENT_ID --set-client-secret YOUR_CLIENT_SECRET
   ```
3. **Environment Variables**:
   ```bash
   export HI3D_CLIENT_ID=YOUR_CLIENT_ID
   export HI3D_CLIENT_SECRET=YOUR_CLIENT_SECRET
   # or
   export HI3D_API_TOKEN=YOUR_ACCESS_TOKEN
   ```

Check account status and credit balance:
```bash
hi3d balance
```

---

## 2. Inspecting Models & Formats

List available model versions, formats, and resolutions:
```bash
hi3d models
```

### Supported Models:
• `hi3dv3.0` (Default, Resolutions: `2048quality`, `2048master`, PBR)
• `hitem3dv2.1` (Resolutions: `1536fast`, `1536pro`, PBR)
• `hitem3dv2.0` (Resolutions: `1536`, `1536pro`, PBR)
• `hitem3dv1.5` (Resolutions: `512`, `1024`, `1536`, `1536pro`)
• `scene-portraitv2.1` (Scene/Portrait 3D model)

### Supported Formats (`--format`):
• `glb` (Default)
• `obj`
• `stl` (Ideal for 3D printing)
• `fbx`
• `usdz` (Ideal for iOS / AR)
• `3mf` (Ideal for multi-color 3D printing)

---

## 3. Submitting 3D Generation Tasks

### A. Image-to-3D (Single Image)
Convert a 2D image into a 3D model:
```bash
hi3d run image-to-3d \
  --image ./input.png \
  --model hi3dv3.0 \
  --format glb \
  --resolution 2048quality \
  --wait \
  --download ./output_dir
```

### B. Multi-View Image-to-3D
Convert up to 4 orthogonal view images (front, back, left, right):
```bash
hi3d run image-to-3d \
  --multi-images ./front.jpg,./left.jpg \
  --multi-images-bit 1010 \
  --format obj \
  --wait \
  --download ./output_dir
```

### C. Image to 3D Relief
Generate a 3D relief / depth mesh from a single photo:
```bash
hi3d run relief \
  --image ./portrait.png \
  --resolution 1536pro \
  --format stl \
  --wait \
  --download ./output_dir
```

### D. 3D Model Splitting & Multicolor
Split existing 3D models or generate multi-color 3D models:
```bash
hi3d run split --image ./model_preview.png --format 3mf --wait --download ./output_dir
hi3d run multicolor --image ./colored.png --format 3mf --wait --download ./output_dir
```

---

## 4. Querying & Downloading Task Results

Query status of a running task:
```bash
hi3d status <task_id>
```

Query and download completed 3D file:
```bash
hi3d status <task_id> --download ./models
```

---

## 5. Dry Run & Validation

Test inputs without sending API requests:
```bash
hi3d run image-to-3d --image ./chair.png --dry-run
```
