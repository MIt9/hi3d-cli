import assert from "node:assert";
import test from "node:test";
import { parseArgs } from "../src/cli.js";
import { CATEGORY_FORMAT_MAP, FORMAT_MAP, MODELS } from "../src/models.js";

test("parseArgs: parses boolean, value, alias, and positionals", () => {
  const spec = {
    bool: ["--wait", "--dry-run", "--json"],
    value: ["--image", "--format", "--model"],
    alias: { "-i": "--image", "-f": "--format", "-m": "--model", "-w": "--wait" },
  };

  const argv = ["run", "image-to-3d", "-i", "./chair.jpg", "-f", "stl", "-w", "--dry-run"];
  const { flags, positionals } = parseArgs(argv, spec);

  assert.deepStrictEqual(positionals, ["run", "image-to-3d"]);
  assert.strictEqual(flags["--image"], "./chair.jpg");
  assert.strictEqual(flags["--format"], "stl");
  assert.strictEqual(flags["--wait"], true);
  assert.strictEqual(flags["--dry-run"], true);
});

test("models registry: contains hi3dv3.0 and category formats", () => {
  assert.ok(MODELS.some((m) => m.id === "hi3dv3.0"));
  assert.strictEqual(CATEGORY_FORMAT_MAP["image-to-3d"]["obj"], 1);
  assert.strictEqual(CATEGORY_FORMAT_MAP["image-to-3d"]["glb"], 2);
  assert.strictEqual(CATEGORY_FORMAT_MAP["relief"]["exr"], 1);
  assert.strictEqual(CATEGORY_FORMAT_MAP["relief"]["png"], 2);
  assert.strictEqual(CATEGORY_FORMAT_MAP["relief"]["stl"], 3);
  assert.strictEqual(CATEGORY_FORMAT_MAP["relief"]["bmp"], 6);
  assert.strictEqual(CATEGORY_FORMAT_MAP["split"]["obj"], 1);
  assert.strictEqual(CATEGORY_FORMAT_MAP["multicolor"]["3mf"], 6);
});
