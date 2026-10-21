import assert from "node:assert/strict";
import { test } from "node:test";
import { rememberChatMessage } from "./chat_message_deduplicator.js";

test("recognizes duplicate message IDs and bounds retained IDs", () => {
  const seen = new Set();

  assert.equal(rememberChatMessage(seen, "message-1", 2), false);
  assert.equal(rememberChatMessage(seen, "message-1", 2), true);
  assert.equal(rememberChatMessage(seen, "message-2", 2), false);
  assert.equal(rememberChatMessage(seen, "message-3", 2), false);
  assert.equal(seen.has("message-1"), false);
  assert.equal(rememberChatMessage(seen, "message-1", 2), false);
});

test("ignores missing IDs so messages without Twitch tags can still be handled", () => {
  assert.equal(rememberChatMessage(new Set(), undefined), false);
  assert.equal(rememberChatMessage(new Set(), ""), false);
});
