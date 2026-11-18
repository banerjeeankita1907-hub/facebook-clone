export const MAX_POST_LENGTH = 500;
export const MAX_COMMENT_LENGTH = 240;
export const MAX_AUTHOR_LENGTH = 40;

function requiredText(value, field, maxLength) {
  if (typeof value !== "string") throw new TypeError(`${field} must be text`);
  const text = value.trim();
  if (!text) throw new RangeError(`${field} cannot be empty`);
  if (text.length > maxLength) throw new RangeError(`${field} must be ${maxLength} characters or fewer`);
  return text;
}

function validTimestamp(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new RangeError("createdAt must be a valid date");
  return date.toISOString();
}

export function createPost({ id, author, body, createdAt = new Date().toISOString() }) {
  const safeId = requiredText(id, "id", 100);
  return {
    id: safeId,
    author: requiredText(author, "author", MAX_AUTHOR_LENGTH),
    body: requiredText(body, "body", MAX_POST_LENGTH),
    createdAt: validTimestamp(createdAt),
    likes: [],
    comments: [],
  };
}

export function createComment({ id, author, body, createdAt = new Date().toISOString() }) {
  return {
    id: requiredText(id, "id", 100),
    author: requiredText(author, "author", MAX_AUTHOR_LENGTH),
    body: requiredText(body, "comment", MAX_COMMENT_LENGTH),
    createdAt: validTimestamp(createdAt),
  };
}

export function toggleLike(posts, postId, userId) {
  const actor = requiredText(userId, "userId", MAX_AUTHOR_LENGTH);
  let found = false;
  const next = posts.map((post) => {
    if (post.id !== postId) return post;
    found = true;
    const likes = Array.isArray(post.likes) ? post.likes : [];
    const hasLiked = likes.includes(actor);
    return { ...post, likes: hasLiked ? likes.filter((name) => name !== actor) : [...likes, actor] };
  });
  if (!found) throw new RangeError("post not found");
  return next;
}

export function addComment(posts, postId, comment) {
  const normalized = createComment(comment);
  let found = false;
  const next = posts.map((post) => {
    if (post.id !== postId) return post;
    found = true;
    return { ...post, comments: [...(Array.isArray(post.comments) ? post.comments : []), normalized] };
  });
  if (!found) throw new RangeError("post not found");
  return next;
}

export function filterPosts(posts, { query = "", filter = "all", currentUser = "You" } = {}) {
  const needle = String(query).trim().toLocaleLowerCase();
  return posts.filter((post) => {
    if (filter === "mine" && post.author !== currentUser) return false;
    if (filter === "liked" && !(post.likes || []).includes(currentUser)) return false;
    if (needle) {
      const searchable = [post.author, post.body, ...(post.comments || []).map((item) => item.body)]
        .join(" ").toLocaleLowerCase();
      if (!searchable.includes(needle)) return false;
    }
    return true;
  });
}

export function sortPosts(posts, order = "newest") {
  const direction = order === "oldest" ? 1 : -1;
  return [...posts].sort((a, b) => direction * (Date.parse(a.createdAt) - Date.parse(b.createdAt)));
}

export function normalizeStoredPosts(value) {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    try {
      const post = createPost(item);
      const likes = Array.isArray(item.likes)
        ? [...new Set(item.likes.filter((name) => typeof name === "string" && name.trim()).map((name) => name.trim()))]
        : [];
      const comments = Array.isArray(item.comments)
        ? item.comments.flatMap((comment) => {
            try { return [createComment(comment)]; } catch { return []; }
          })
        : [];
      return [{ ...post, likes, comments }];
    } catch {
      return [];
    }
  });
}
