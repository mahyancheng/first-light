import test from "node:test";
import assert from "node:assert/strict";
import { createGame } from "../src/engine.mjs";
import { validateProposal } from "../src/advisor.mjs";
test("supplier conversations can create executable term drafts without changing state", () => {
  const s = createGame();
  const before = structuredClone(s);
  const a = {
    type: "request_quote",
    supplier: "helium",
    units: 17,
    duration: 6,
    start: 2,
    price: 11000,
    cancellable: true,
  };
  validateProposal(s, a, "helium");
  assert.deepEqual(s, before);
  assert.equal(a.units, 17);
  assert.equal(a.start, 2);
  assert.equal(a.cancellable, true);
});
test("counterparties cannot propose another company terms or manage the founder", () => {
  const s = createGame();
  assert.throws(() =>
    validateProposal(
      s,
      {
        type: "request_quote",
        supplier: "helium",
        units: 5,
        duration: 2,
        start: 0,
        price: 10000,
      },
      "northstar",
    ),
  );
  assert.throws(() =>
    validateProposal(s, { type: "hire", role: "research", count: 5 }, "helium"),
  );
});
test("rival licensing drafts validate royalty, duration and requested fee", () => {
  const s = createGame();
  validateProposal(
    s,
    {
      type: "request_license",
      companyId: "arc",
      duration: 8,
      fee: 400000,
      royalty: 12,
    },
    "arc",
  );
  assert.throws(() =>
    validateProposal(
      s,
      {
        type: "request_license",
        companyId: "arc",
        duration: -1,
        fee: 400000,
        royalty: 12,
      },
      "arc",
    ),
  );
});
