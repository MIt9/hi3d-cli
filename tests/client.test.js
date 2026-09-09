import assert from "node:assert";
import test from "node:test";
import { Hi3DClient, Hi3DError } from "../src/client.js";

test("Hi3DClient: throws error when fetching token without credentials", async () => {
  const client = new Hi3DClient();
  await assert.rejects(async () => {
    await client.fetchToken();
  }, Hi3DError);
});

test("Hi3DClient: initializes with custom token or env", () => {
  const client = new Hi3DClient({ token: "test_token_123" });
  assert.strictEqual(client.token, "test_token_123");
});
