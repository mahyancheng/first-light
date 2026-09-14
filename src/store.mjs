import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { createHash } from "node:crypto";
import { GameError } from "./engine.mjs";
export class Store {
  constructor(path) {
    mkdirSync(dirname(path), { recursive: true });
    this.db = new DatabaseSync(path);
    this.db.exec(
      "PRAGMA journal_mode=WAL; PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS games(owner TEXT PRIMARY KEY, state TEXT NOT NULL); CREATE TABLE IF NOT EXISTS requests(owner TEXT NOT NULL, id TEXT NOT NULL, hash TEXT NOT NULL, result TEXT NOT NULL, PRIMARY KEY(owner,id));",
    );
  }
  get(owner) {
    const r = this.db
      .prepare("SELECT state FROM games WHERE owner=?")
      .get(owner);
    return r ? JSON.parse(r.state) : null;
  }
  transact(owner, id, payload, operation) {
    if (typeof id !== "string" || !/^[a-zA-Z0-9_-]{8,100}$/.test(id))
      throw new GameError("A stable request ID is required.", 400);
    const hash = createHash("sha256")
      .update(JSON.stringify(payload))
      .digest("hex");
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const old = this.db
        .prepare("SELECT hash,result FROM requests WHERE owner=? AND id=?")
        .get(owner, id);
      if (old) {
        if (old.hash !== hash)
          throw new GameError(
            "This request ID belongs to a different action.",
            409,
          );
        this.db.exec("COMMIT");
        return JSON.parse(old.result);
      }
      const current = this.get(owner);
      if (current && payload.revision !== current.revision)
        throw new GameError(
          "The company changed in another request. Refresh the current state before deciding again.",
          409,
        );
      const next = operation(current);
      next.revision = (current?.revision ?? -1) + 1;
      this.db
        .prepare(
          "INSERT INTO games VALUES(?,?) ON CONFLICT(owner) DO UPDATE SET state=excluded.state",
        )
        .run(owner, JSON.stringify(next));
      const result = { revision: next.revision };
      this.db
        .prepare("INSERT INTO requests VALUES(?,?,?,?)")
        .run(owner, id, hash, JSON.stringify(result));
      this.db.exec("COMMIT");
      return result;
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  updateChat(owner, id, result) {
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const s = this.get(owner);
      const chat = s?.chats.find((c) => c.id === id);
      if (chat && chat.status === "pending") {
        Object.assign(chat, result);
        s.revision++;
        this.db
          .prepare("UPDATE games SET state=? WHERE owner=?")
          .run(JSON.stringify(s), owner);
      }
      this.db.exec("COMMIT");
    } catch (e) {
      this.db.exec("ROLLBACK");
      throw e;
    }
  }
  recover() {
    for (const row of this.db.prepare("SELECT owner,state FROM games").all()) {
      const s = JSON.parse(row.state);
      let changed = false;
      for (const c of s.chats) {
        if (c.status === "pending") {
          c.status = "failed";
          c.reply =
            "The service restarted before this reply completed. Your message is saved; no action was executed.";
          changed = true;
        }
      }
      if (changed) {
        s.revision++;
        this.db
          .prepare("UPDATE games SET state=? WHERE owner=?")
          .run(JSON.stringify(s), row.owner);
      }
    }
  }
  close() {
    this.db.close();
  }
}
