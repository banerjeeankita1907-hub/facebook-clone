# CampusLoop

A responsive, local-first community feed prototype built with vanilla JavaScript. Compose posts, search and filter the feed, react to updates, and reply in context — with no account, server, build step, or third-party runtime dependency.

> The GitHub repository is currently named `facebook-clone`; the application is branded **CampusLoop**. The repository slug is inherited from an empty starter and should be renamed to `campusloop` in GitHub settings when repository rename access is available. It is an independent learning project and is not affiliated with or endorsed by Meta or Facebook.

## Features

- Post composer with author and content limits.
- Search across post text, authors, and comments.
- Feed filters for all posts, your posts, and posts you liked.
- Newest/oldest sorting.
- Per-user like toggling and threaded replies.
- Browser-local persistence with defensive storage parsing.
- Responsive layout, keyboard focus states, reduced-motion support, and semantic labels.
- Safe DOM rendering through `textContent`; user-generated text is never inserted as HTML.

## Run locally

Requires Node.js 20+ for tests and any static file server for the browser app.

```bash
git clone https://github.com/banerjeeankita1907-hub/facebook-clone.git
cd facebook-clone
npm test
npm run check
python -m http.server 4173
```

Open [http://localhost:4173](http://localhost:4173).

## Architecture

```text
index.html             Accessible app shell
src/app.js             DOM rendering, events, and local persistence
src/feed-core.js       Pure domain functions and input validation
src/styles.css         Responsive interface and interaction states
tests/feed-core.test.js
.github/workflows/ci.yml
```

The domain layer is intentionally independent of the browser so its behavior can be tested with Node's built-in test runner. There are no production dependencies or API keys.

## Data and privacy

Posts are stored in this browser's `localStorage` under `campusloop.posts.v1`. This demo has no authentication, remote synchronization, encryption, moderation service, or multi-device account system. Do not enter sensitive or confidential information. Clearing this site's browser storage removes local demo posts.

## Scope and next steps

This is a front-end portfolio prototype, not a production social network. A production deployment would need identity and authorization, server-side validation, durable storage, abuse reporting and moderation, rate limits, privacy controls, and an explicit retention policy.

## Tests

```bash
npm test
npm run check
```

## License

MIT. See [LICENSE](LICENSE).
