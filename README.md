# First Light

An original AI-company strategy game. Begin in 2023 with a small team, $4m and a thesis. Design intelligence, earn customers, secure resources, and live with the consequences.

**Clean-room replacement:** this repository contains a new design, simulation, server, persistence model and interface. It imports no source, assets, engine, saved state or game logic from Frontier Capital. Only the broad AI-company premise is retained.

## Play loop

HQ explains the current company situation. Lab composes architecture × training × output × scale × data. Business connects validated models to products, hiring, marketing and finance. Industry provides priced, capacity-constrained supply negotiation, rival conversations and model licensing. Licences transfer upfront fees and realised royalties to the counterparty and expire on a fixed date. Decisions commits the quarter and reports actual outcomes and reconciled accounts.

Research needs time, researchers and compute. Products earn revenue only from served demand. Competitors improve their offerings. Compute contracts reserve finite supplier capacity and bill on their exact schedule, including unused capacity. Financing can be declined; successful equity financing dilutes founder ownership. Unpaid operating obligations can put the company into administration.

All prices, qualities, growth factors and scenarios are fictional game parameters. They are not estimates of historical market data. This first playable implements the founder-to-operating-business campaign. IPOs, board control, acquisitions, multiplayer, physical infrastructure construction and arbitrary generated technologies are not implemented; the advisor must identify unsupported requests instead of claiming to execute them.

## Run and test

Node 24 or later. The game itself has no external runtime package dependencies.

```
node --test test/*.test.mjs
node src/build.mjs
node src/server.mjs
```

Open port 3111. The source does not require a browser build service, a local Mac checkout, or hosted database credentials. GitHub Actions tests and builds a native ARM64 container. Deploy the immutable commit tag from `ghcr.io/mahyancheng/first-light`.

## Persistence and reliability

SQLite WAL with full synchronous commits is the server authority. A cryptographically random HttpOnly cookie identifies the founder. Request IDs and payload hashes are committed with state; retries return the same receipt, and reused IDs with different payloads fail. Revision checks prevent stale writes. Quarter resolution runs inside one transaction. Rejected moves leave a reason without silently executing. Every closed quarter reconciles opening cash, operating inflows/outflows, investments, financing and principal.

Conversation messages are committed before model work begins. The browser can continue playing while a reply runs. Replies update their original record. Process restart marks interrupted replies honestly. AI proposals never auto-queue. Game controls function without the model.

## Optional live conversation

The runtime can use its own dedicated `CODEX_HOME` and the pinned Codex CLI, authenticated using the operator's existing authorised ChatGPT account. No credentials are committed to this repository or passed to GitHub Actions. Conversation execution is ephemeral, read-only, with shell, patch, plugin, multi-agent, JS and web-search features disabled. JSON output is schema-constrained, and proposed actions are validated again against current game state when queued.

The implementation follows [Codex non-interactive execution](https://developers.openai.com/codex/noninteractive/). It never launches an app-server for a Desktop-owned task. Local developer runs leave live AI disabled unless explicitly configured.

## Deployment

Run a single service with persistent `/data`, read-only application filesystem, writable `/tmp`, and an optional separate writable Codex home. Bind its port only to the operator's tailnet address. Existing games and credentials are not part of the image. Never deploy a SQLite database on a filesystem that does not support SQLite locking; never run multiple replicas against the same volume.
