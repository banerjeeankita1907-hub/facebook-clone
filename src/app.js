import {
  addComment,
  createComment,
  createPost,
  filterPosts,
  normalizeStoredPosts,
  sortPosts,
  toggleLike,
} from "./feed-core.js";

const STORAGE_KEY = "campusloop.posts.v1";
const CURRENT_USER = "You";

const seedPosts = [
  {
    id: "welcome-1",
    author: "Maya Chen",
    body: "Welcome to CampusLoop 👋 Share a project you are working on, a question you are thinking about, or a small win from this week.",
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    likes: ["Ari"],
    comments: [{ id: "welcome-comment-1", author: "Ari", body: "Happy to be here. Looking forward to seeing what everyone is building!", createdAt: new Date(Date.now() - 1000 * 60 * 31).toISOString() }],
  },
  {
    id: "welcome-2",
    author: "Jordan Lee",
    body: "Tiny challenge for today: explain one concept you learned this week in three sentences or less. Teaching is a great way to test your understanding.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    likes: [],
    comments: [],
  },
];

const $ = (selector) => document.querySelector(selector);
const feedElement = $("#feed");
const statusElement = $("#status");
const postForm = $("#post-form");
const postBody = $("#post-body");
const authorInput = $("#post-author");
const searchInput = $("#search");
const sortSelect = $("#sort");
const feedTitle = $("#feed-title");
let posts = loadPosts();
let activeFilter = "all";

function loadPosts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === null ? seedPosts : normalizeStoredPosts(JSON.parse(saved));
  } catch {
    return seedPosts;
  }
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
    statusElement.textContent = "Saved in this browser.";
  } catch {
    statusElement.textContent = "Browser storage is unavailable. Your latest changes may not persist.";
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function initials(name) {
  return name.split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function formatDate(value) {
  const date = new Date(value);
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

function button(label, className, action, postId, pressed) {
  const node = element("button", className, label);
  node.type = "button";
  node.dataset.action = action;
  node.dataset.postId = postId;
  if (pressed !== undefined) node.setAttribute("aria-pressed", String(pressed));
  return node;
}

function renderPost(post) {
  const article = element("article", "post-card card");
  const header = element("div", "post-header");
  const avatar = element("div", "avatar", initials(post.author));
  avatar.setAttribute("aria-hidden", "true");
  const authorBlock = element("div", "post-author");
  authorBlock.append(element("strong", "", post.author), element("time", "muted post-time", formatDate(post.createdAt)));
  const menu = element("span", "post-tag", "COMMUNITY");
  header.append(avatar, authorBlock, menu);
  article.append(header, element("p", "post-body", post.body));

  const actions = element("div", "post-actions");
  const liked = (post.likes || []).includes(CURRENT_USER);
  actions.append(
    button(`${liked ? "♥" : "♡"}  ${(post.likes || []).length} likes`, liked ? "action-button liked" : "action-button", "like", post.id, liked),
    element("span", "muted comment-count", `${(post.comments || []).length} comments`),
  );
  article.append(actions);

  const comments = element("div", "comments");
  for (const comment of post.comments || []) {
    const row = element("p", "comment");
    row.append(element("strong", "", comment.author), document.createTextNode(" " + comment.body));
    comments.append(row);
  }
  const commentForm = element("form", "comment-form");
  commentForm.dataset.postId = post.id;
  const input = element("input", "comment-input");
  input.name = "comment";
  input.maxLength = 240;
  input.required = true;
  input.placeholder = "Write a thoughtful reply…";
  input.setAttribute("aria-label", `Reply to ${post.author}'s post`);
  const submit = element("button", "button button-quiet", "Reply");
  submit.type = "submit";
  commentForm.append(input, submit);
  comments.append(commentForm);
  article.append(comments);
  return article;
}

function render() {
  const visible = sortPosts(filterPosts(posts, {
    query: searchInput.value,
    filter: activeFilter,
    currentUser: CURRENT_USER,
  }), sortSelect.value);

  feedElement.replaceChildren();
  $("#all-count").textContent = String(posts.length);
  feedTitle.textContent = activeFilter === "mine"
    ? "My posts"
    : activeFilter === "liked" ? "Liked posts" : "Community feed";

  if (!visible.length) {
    const empty = element("div", "empty-state card");
    empty.append(element("span", "empty-icon", "✳"), element("h3", "", "No posts found"), element("p", "muted", "Try another search or be the first to start a conversation."));
    feedElement.append(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  for (const post of visible) fragment.append(renderPost(post));
  feedElement.append(fragment);
}

function announce(message) {
  statusElement.textContent = message;
}

postBody.addEventListener("input", () => {
  $("#character-count").textContent = `${postBody.value.length} / 500`;
});

postForm.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const post = createPost({
      id: crypto.randomUUID(),
      author: authorInput.value,
      body: postBody.value,
      createdAt: new Date().toISOString(),
    });
    posts = [post, ...posts];
    postBody.value = "";
    $("#character-count").textContent = "0 / 500";
    persist();
    render();
    announce("Your post has been published.");
    postBody.focus();
  } catch (error) {
    announce(error.message);
  }
});

feedElement.addEventListener("click", (event) => {
  const target = event.target.closest("button[data-action='like']");
  if (!target) return;
  try {
    posts = toggleLike(posts, target.dataset.postId, CURRENT_USER);
    persist();
    render();
  } catch (error) {
    announce(error.message);
  }
});

feedElement.addEventListener("submit", (event) => {
  const form = event.target.closest("form.comment-form");
  if (!form) return;
  event.preventDefault();
  const input = form.elements.comment;
  try {
    const comment = createComment({
      id: crypto.randomUUID(),
      author: CURRENT_USER,
      body: input.value,
      createdAt: new Date().toISOString(),
    });
    posts = addComment(posts, form.dataset.postId, comment);
    persist();
    render();
    announce("Reply added.");
  } catch (error) {
    announce(error.message);
  }
});

searchInput.addEventListener("input", render);
sortSelect.addEventListener("change", render);

document.querySelectorAll("[data-filter]").forEach((filterButton) => {
  filterButton.addEventListener("click", () => {
    activeFilter = filterButton.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((item) => {
      const active = item === filterButton;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-current", active ? "page" : "false");
    });
    render();
  });
});

$("#today-label").textContent = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date()).toUpperCase();
render();
