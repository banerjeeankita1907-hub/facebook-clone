import test from "node:test";
import assert from "node:assert/strict";
import {
  addComment, createComment, createPost, filterPosts,
  normalizeStoredPosts, sortPosts, toggleLike,
} from "../src/feed-core.js";

const base = () => [
  createPost({ id: "p1", author: "Maya", body: "Building a weather app", createdAt: "2025-01-01T00:00:00Z" }),
  createPost({ id: "p2", author: "You", body: "Finished my first prototype", createdAt: "2025-01-02T00:00:00Z" }),
];

test("createPost trims values and normalizes its timestamp", () => {
  const post = createPost({ id: " p ", author: " You ", body: " Hello ", createdAt: "2025-01-01T00:00:00Z" });
  assert.equal(post.id, "p");
  assert.equal(post.author, "You");
  assert.equal(post.body, "Hello");
  assert.deepEqual(post.likes, []);
});

test("createPost rejects empty and oversized content", () => {
  assert.throws(() => createPost({ id: "1", author: "You", body: "  " }), /cannot be empty/);
  assert.throws(() => createPost({ id: "1", author: "You", body: "x".repeat(501) }), /500 characters/);
  assert.throws(() => createPost({ id: "1", author: "x".repeat(41), body: "ok" }), /40 characters/);
  assert.throws(() => createPost({ id: "1", author: "You", body: "ok", createdAt: "not-a-date" }), /valid date/);
});

test("toggleLike adds and removes only the selected user's reaction without mutation", () => {
  const original = base();
  const once = toggleLike(original, "p1", "You");
  assert.deepEqual(once[0].likes, ["You"]);
  assert.deepEqual(original[0].likes, []);
  const twice = toggleLike(once, "p1", "You");
  assert.deepEqual(twice[0].likes, []);
  assert.throws(() => toggleLike(original, "missing", "You"), /not found/);
});

test("comments are validated and added immutably", () => {
  const original = base();
  const comment = createComment({ id: "c1", author: "You", body: "Nice work", createdAt: "2025-01-03T00:00:00Z" });
  const next = addComment(original, "p1", comment);
  assert.equal(next[0].comments.length, 1);
  assert.equal(original[0].comments.length, 0);
  assert.throws(() => createComment({ id: "c2", author: "You", body: "x".repeat(241) }), /240 characters/);
  assert.throws(() => addComment(original, "missing", comment), /not found/);
});

test("filterPosts supports author, body, comments, own posts and liked posts", () => {
  const posts = toggleLike(base(), "p1", "You");
  const withReply = addComment(posts, "p2", { id: "c1", author: "Ari", body: "Curious about the prototype" });
  assert.equal(filterPosts(withReply, { query: "WEATHER" }).length, 1);
  assert.equal(filterPosts(withReply, { query: "curious" }).length, 1);
  assert.equal(filterPosts(withReply, { filter: "mine" }).length, 1);
  assert.equal(filterPosts(withReply, { filter: "liked" })[0].id, "p1");
});

test("sortPosts orders dates and does not mutate input", () => {
  const posts = base();
  assert.deepEqual(sortPosts(posts).map((post) => post.id), ["p2", "p1"]);
  assert.deepEqual(sortPosts(posts, "oldest").map((post) => post.id), ["p1", "p2"]);
  assert.equal(posts[0].id, "p1");
});

test("normalizeStoredPosts discards malformed records and sanitizes nested data", () => {
  const normalized = normalizeStoredPosts([
    { id: "ok", author: "You", body: "safe", createdAt: "2025-01-01T00:00:00Z", likes: [" You ", 3, ""], comments: [{ id: "c", author: "Ari", body: "hello" }, { id: "bad", author: "", body: "x" }] },
    { id: "bad", author: "", body: "no" },
    null,
  ]);
  assert.equal(normalized.length, 1);
  assert.deepEqual(normalized[0].likes, ["You"]);
  assert.equal(normalized[0].comments.length, 1);
});
