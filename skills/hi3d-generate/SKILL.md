---
name: hi3d-generate
description: Generate 3D models (GLB, OBJ, STL, FBX, USDZ, 3MF, EXR, PNG, BMP) from images, reliefs, model splitting, and multicolor using Hi3D API via hi3d CLI. Use whenever the user wants to convert photos or images into 3D models, generate 3D reliefs, split 3D models, or manage Hi3D generation tasks.
---

# Hi3D 3D Model Generation Skill (`hi3d-generate`)

This skill enables AI agents to generate 3D models, reliefs, model splitting, and multi-color 3D objects using the **Hi3D API** (`https://api.hitem3d.ai`) via the lightweight `hi3d` CLI.

---

## 1. Prerequisites & Credentials

Hi3D requires Access Key (`ak_...`) & Secret Key (`sk_...`) from [https://platform.hi3d.ai/console/apiKey](https://platform.hi3d.ai/console/apiKey).

### Configuration Options:
1. **Interactive / Non-interactive Setup**:
   ```bash
   hi3d setup --yes --access-key ak_... --secret-key sk_...
   ```
2. **CLI Config Command**:
   ```bash
   hi3d config --set-access-key ak_... --set-secret-key sk_...
   ```
3. **Environment Variables**:
   ```bash
   export HI3D_ACCESS_KEY=ak_...
   export HI3D_SECRET_KEY=sk_...
   ```

Check account status and credit balance:
```bash
hi3d balance
```

---

## 2. Models, Resolutions & Formats

List available model versions, formats, and resolutions:
```bash
hi3d models
```

### Models & Resolutions:
• **General Models**: `hi3dv3.0` (`2048quality`, `2048master`), `hitem3dv2.1` (`1536fast`, `1536pro`), `hitem3dv2.0` (`1536`, `1536pro`), `hitem3dv1.5` (`512`, `1024`, `1536`, `1536pro`)
• **Portrait Models**: `scene-portraitv2.1` (`1536profast`, `1536pro`), `scene-portraitv2.0` (`1536pro`), `scene-portraitv1.5` (`1536`)
• **Depth Map / Relief Models**: `pro` (`Pro`), `base` (`Base`)
• **Split Models**: `character`, `general`
• **Multicolor Models**: `multicolor`

### Supported Export Formats by Category:
• **`image-to-3d`**: `obj`, `glb`, `stl`, `fbx`, `usdz`, `3mf`
• **`relief`**: `exr`, `png`, `stl`, `glb`, `3mf`, `bmp`
• **`split`**: `obj`, `glb`, `stl`, `fbx`, `usdz`
• **`multicolor`**: `obj`, `glb`, `fbx`, `3mf`

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
  --model pro \
  --resolution Pro \
  --format stl \
  --wait \
  --download ./output_dir
```

### D. 3D Model Splitting & Multicolor
Split existing 3D models or generate multi-color 3D models:
```bash
hi3d run split --image ./character.png --model character --format fbx --wait --download ./output_dir
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
