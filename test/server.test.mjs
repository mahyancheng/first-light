import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { app } from "../src/server.mjs";
async function fixture(t, ai) {
  const dir = await mkdtemp(join(tmpdir(), "first-light-test-"));
  const runtime = app({ dbPath: join(dir, "test.sqlite"), ai });
  await new Promise((r) => runtime.server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${runtime.server.address().port}`;
  t.after(async () => {
    await new Promise((r) => runtime.server.close(r));
    runtime.store.close();
    await rm(dir, { recursive: true, force: true });
  });
  let cookie;
  const get = async () => {
    const r = await fetch(base + "/api/state", {
      headers: cookie ? { cookie } : {},
    });
    cookie ??= r.headers.get("set-cookie")?.split(";")[0];
    return r.json();
  };
  const post = async (path, b) => {
    const r = await fetch(base + "/api/" + path, {
      method: "POST",
      headers: { cookie, "content-type": "application/json", origin: base },
      body: JSON.stringify(b),
    });
    return { status: r.status, body: await r.json() };
  };
  await get();
  return { get, post, runtime, base };
}
test("lost-response retries do not found or close a quarter twice", async (t) => {
  const f = await fixture(t);
  const b = { id: "found0001", name: "Test", thesis: "Useful intelligence" };
  assert.equal((await f.post("found", b)).status, 200);
  assert.equal((await f.post("found", b)).status, 200);
  const a = { id: "resolve01", revision: 0 };
  assert.equal((await f.post("resolve", a)).status, 200);
  assert.equal((await f.post("resolve", a)).status, 200);
  assert.equal((await f.get()).state.quarter, 1);
});
test("reusing an id for a different intent fails closed", async (t) => {
  const f = await fixture(t);
  await f.post("found", { id: "found0001", name: "A", thesis: "B" });
  assert.equal(
    (await f.post("found", { id: "found0001", name: "C", thesis: "B" })).status,
    409,
  );
  assert.equal((await f.get()).state.name, "A");
});
test("stale revisions refuse an action without losing the latest state", async (t) => {
  const f = await fixture(t);
  await f.post("found", { id: "found0001", name: "A", thesis: "B" });
  await f.post("stage", {
    id: "stage0001",
    revision: 0,
    action: { type: "hire", role: "sales", count: 1 },
  });
  assert.equal(
    (await f.post("resolve", { id: "resolve01", revision: 0 })).status,
    409,
  );
  assert.equal((await f.get()).state.queue.length, 1);
});
test("failed transactions cannot partially write game state", async (t) => {
  const f = await fixture(t);
  await f.post("found", { id: "found0001", name: "A", thesis: "B" });
  assert.equal(
    (
      await f.post("stage", {
        id: "stage0001",
        revision: 0,
        action: { type: "hire", role: "research", count: -1 },
      })
    ).status,
    422,
  );
  assert.equal((await f.get()).state.revision, 0);
});
test("a new browser cannot see another founder campaign", async (t) => {
  const f = await fixture(t);
  await f.post("found", { id: "found0001", name: "Private", thesis: "B" });
  const r = await fetch(f.base + "/api/state");
  assert.equal((await r.json()).state, null);
});
test("conversations are durable before model execution and never auto-queue", async (t) => {
  let finish;
  let calls = 0;
  const f = await fixture(t, () => {
    calls++;
    return new Promise((r) => (finish = r));
  });
  await f.post("found", { id: "found0001", name: "A", thesis: "B" });
  const b = {
    id: "chat00001",
    revision: 0,
    counterparty: "chief",
    message: "Hire a researcher",
  };
  assert.equal((await f.post("chat", b)).status, 202);
  assert.equal((await f.get()).state.chats[0].status, "pending");
  assert.equal((await f.post("chat", b)).status, 200);
  assert.equal(calls, 1);
  finish({
    status: "complete",
    reply: "Here is a proposal.",
    proposals: [
      {
        label: "Hire",
        reason: "Support research",
        action: { type: "hire", role: "research", count: 1 },
      },
    ],
  });
  await new Promise((r) => setImmediate(r));
  const s = (await f.get()).state;
  assert.equal(s.chats[0].status, "complete");
  assert.equal(s.queue.length, 0);
});
test("recovery marks interrupted conversations without claiming delivery", async (t) => {
  const f = await fixture(t, async () => ({
    status: "failed",
    reply: "Unavailable",
    proposals: [],
  }));
  await f.post("found", { id: "found0001", name: "A", thesis: "B" });
  const owner = f.runtime.store.db
    .prepare("SELECT owner FROM games")
    .get().owner;
  f.runtime.store.transact(owner, "pending01", { revision: 0 }, (s) => ({
    ...s,
    chats: [{ id: "chat00001", status: "pending" }],
  }));
  f.runtime.store.recover();
  assert.equal((await f.get()).state.chats[0].status, "failed");
});

test("an ended campaign can restart without erasing its archived history", async (t) => {
  const f = await fixture(t);
  await f.post("found", { id: "found0001", name: "First", thesis: "A" });
  const owner = f.runtime.store.db
    .prepare("SELECT owner FROM games")
    .get().owner;
  f.runtime.store.transact(owner, "cash00001", { revision: 0 }, (s) => ({
    ...s,
    cash: 1,
  }));
  await f.post("resolve", { id: "resolve01", revision: 1 });
  assert.equal((await f.get()).state.status, "administration");
  const b = { id: "restart01", revision: 2, name: "Second", thesis: "B" };
  assert.equal((await f.post("restart", b)).status, 200);
  assert.equal((await f.post("restart", b)).status, 200);
  assert.equal((await f.get()).state.name, "Second");
  assert.equal(f.runtime.store.archives(owner).length, 1);
  assert.equal(f.runtime.store.archives(owner)[0].name, "First");
});
