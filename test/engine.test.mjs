import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  design,
  stage,
  resolve,
  quote,
  supplierFree,
  capacity,
  validate,
  journey,
} from "../src/engine.mjs";
const research = {
  type: "research",
  name: "Code seed",
  architecture: "dense",
  method: "adapt",
  output: "code",
  scale: 3,
  data: 2,
};
const move = (s, a, id = "move00001") => stage(s, a, id);
function close(s, id = "quarter0001") {
  return resolve(s, id);
}
test("research choices produce distinct cost and serving trade-offs", () => {
  const dense = design(research),
    sparse = design({ ...research, architecture: "mixture" });
  assert.ok(sparse.budget > dense.budget);
  assert.ok(sparse.serve < dense.serve);
  assert.throws(
    () => design({ ...research, architecture: "diffusion" }),
    /does not support/,
  );
});
test("a design consumes money and capacity before it becomes a usable model", () => {
  const s = createGame();
  const next = close(move(s, research));
  assert.ok(next.cash < s.cash);
  assert.equal(next.models.length, 0);
  assert.ok(next.projects[0].progress > 0);
  assert.equal(s.projects.length, 0);
});
test("research, launch, customers and accounting form a complete replayable campaign", () => {
  function play() {
    let s = createGame("Test", "Efficient code", 42);
    s = move(s, research);
    for (let i = 0; i < 5 && !s.models.length; i++) s = close(s);
    assert.equal(s.models.length, 1);
    s = move(
      s,
      {
        type: "launch",
        name: "Patch alternative",
        modelId: s.models[0].id,
        price: 1700,
      },
      "launch0001",
    );
    for (let i = 0; i < 5; i++) s = close(s);
    assert.ok(s.products[0].customers > 0);
    for (const h of s.history)
      assert.equal(
        h.opening +
          h.revenue -
          h.opex -
          h.investment +
          h.financing -
          h.principal,
        h.closing,
      );
    return s;
  }
  assert.deepEqual(play(), play());
});
test("insufficient compute stops research progress without granting capability", () => {
  let s = createGame();
  s.staff.research = 0;
  s = close(move(s, research));
  assert.equal(s.projects[0].progress, 0);
  assert.equal(s.models.length, 0);
});
test("hiring costs are paid first and staff join only the following quarter", () => {
  let s = createGame();
  s = close(move(s, { type: "hire", role: "research", count: 3 }));
  assert.equal(s.staff.research, 4);
  s = close(s);
  assert.equal(s.staff.research, 7);
});
test("simultaneous actions share cash and rejected actions have receipts", () => {
  let s = createGame();
  s.cash = 500000;
  s = move(s, { ...research, scale: 7, data: 5 }, "research1");
  s = move(s, { ...research, scale: 7, data: 5 }, "research2");
  s = close(s);
  assert.equal(s.projects.length, 1);
  assert.equal(s.receipts.filter((x) => x.status === "rejected").length, 1);
});
test("quotes preserve exact schedule and cancellation; below-floor requests counter", () => {
  const s = createGame();
  const a = {
    supplier: "helium",
    units: 22,
    duration: 7,
    start: 2,
    price: 1000,
    cancellable: true,
  };
  const q = quote(s, a, "quote0001");
  assert.equal(q.duration, 7);
  assert.equal(q.end, 8);
  assert.equal(q.units, 22);
  assert.equal(q.requested.price, 1000);
  assert.equal(q.withinBudget, false);
  assert.equal(q.cancellable, true);
  assert.equal(q.total, q.price * 22 * 7);
});
test("overlapping supplier commitments cannot oversell capacity", () => {
  let s = createGame();
  s.cash = 100000000;
  const a = {
    supplier: "helium",
    units: 100,
    duration: 4,
    start: 0,
    price: 15000,
    cancellable: false,
  };
  s.offers = [quote(s, a, "offer0001"), quote(s, a, "offer0002")];
  s = move(s, { type: "accept_offer", offerId: "offer0001" }, "accept001");
  s = move(s, { type: "accept_offer", offerId: "offer0002" }, "accept002");
  s = close(s);
  assert.equal(s.contracts.length, 1);
  assert.equal(supplierFree(s, "helium", 1, 2), 40);
  assert.equal(s.receipts[1].status, "rejected");
});
test("contract bills exactly the specified delivery quarters", () => {
  let s = createGame();
  s.cash = 100000000;
  const q = quote(
    s,
    {
      supplier: "helium",
      units: 10,
      duration: 2,
      start: 1,
      price: 11000,
      cancellable: false,
    },
    "offer0001",
  );
  s.offers.push(q);
  s = close(move(s, { type: "accept_offer", offerId: q.id }));
  assert.equal(
    s.history[0].log.find((l) => l.text.startsWith("Reserved")).amount,
    0,
  );
  s = close(s);
  assert.equal(
    s.history[1].log.find((l) => l.text.startsWith("Reserved")).amount,
    -q.quarterly,
  );
  s = close(s);
  assert.equal(
    s.history[2].log.find((l) => l.text.startsWith("Reserved")).amount,
    -q.quarterly,
  );
  s = close(s);
  assert.equal(
    s.history[3].log.find((l) => l.text.startsWith("Reserved")).amount,
    0,
  );
  assert.equal(s.contracts[0].status, "fulfilled");
  assert.equal(capacity(s), 12);
});
test("non-cancellable supply cannot be discarded", () => {
  let s = createGame();
  s.offers = [
    quote(
      s,
      {
        supplier: "helium",
        units: 10,
        duration: 4,
        start: 0,
        price: 12000,
        cancellable: false,
      },
      "offer0001",
    ),
  ];
  s = close(move(s, { type: "accept_offer", offerId: "offer0001" }));
  assert.throws(
    () => validate(s, { type: "cancel_contract", contractId: "offer0001" }),
    /non-cancellable/,
  );
});
test("equity financing dilutes; borrowing creates a real liability", () => {
  let s = createGame();
  s = close(move(s, { type: "raise", amount: 1000000, valuation: 3000000 }));
  assert.equal(s.equity, 0.75);
  assert.equal(s.history[0].financing, 1000000);
  s = close(move(s, { type: "borrow", amount: 300000 }));
  assert.equal(s.debt, 285000);
  assert.equal(s.history[1].principal, 15000);
});
test("investors can decline unrealistic terms with no financing or dilution", () => {
  let s = createGame();
  s = close(move(s, { type: "raise", amount: 10000000, valuation: 100000000 }));
  assert.equal(s.equity, 1);
  assert.equal(s.history[0].financing, 0);
  assert.equal(s.receipts[0].status, "rejected");
});
test("no NaN, negative quantities, unknown actions, or unknown actors", () => {
  const s = createGame();
  for (const a of [
    { type: "hire", role: "research", count: NaN },
    { type: "hire", role: "research", count: -1 },
    { type: "hire", role: "__proto__", count: 1 },
    { type: "free_money", amount: 1000000 },
  ])
    assert.throws(() => validate(s, a));
});
test("a failed company stops resolving and preserves its last account", () => {
  let s = createGame();
  s.cash = 100;
  s = close(s);
  assert.equal(s.status, "administration");
  assert.throws(() => close(s), /administration/);
  assert.equal(s.history.length, 1);
});
test("progression responds to company facts and financial stress", () => {
  const s = createGame();
  assert.equal(journey(s).name, "Find your edge");
  s.cash = 100;
  assert.equal(journey(s).name, "Protect the company");
});
test("a 20-seed, 16-quarter strategy trace reconciles every account", () => {
  for (let seed = 1; seed <= 20; seed++) {
    let s = createGame("Trace", "Useful code", seed);
    s = move(s, research);
    for (let q = 0; q < 16 && s.status === "active"; q++) {
      if (s.models.length && !s.products.length)
        s = move(
          s,
          {
            type: "launch",
            name: "Tool",
            modelId: s.models[0].id,
            price: 2000,
          },
          `launch${seed}`,
        );
      s = close(s);
      const h = s.history.at(-1);
      assert.equal(
        h.opening +
          h.revenue -
          h.opex -
          h.investment +
          h.financing -
          h.principal,
        h.closing,
      );
      assert.ok(Number.isFinite(s.cash));
      assert.ok(s.products.every((p) => p.customers >= 0));
    }
  }
});

test("licensing pays the counterparty, grants bounded rights and settles royalties", async () => {
  const { licenseQuote } = await import("../src/engine.mjs");
  let s = createGame();
  const offer = licenseQuote(
    s,
    { companyId: "arc", duration: 2, fee: 300000, royalty: 10 },
    "licence001",
  );
  s.licenseOffers.push(offer);
  s = close(move(s, { type: "license_model", offerId: offer.id }, "license01"));
  assert.equal(s.models[0].licensedUntil, 1);
  assert.equal(s.licenses.length, 1);
  assert.equal(s.history[0].investment, offer.fee);
  s = close(
    move(
      s,
      {
        type: "launch",
        name: "Licensed product",
        modelId: "license01",
        price: 1100,
      },
      "launch002",
    ),
  );
  assert.ok(s.products[0].revenue > 0);
  assert.ok(
    s.history[1].log.find((l) => l.text.startsWith("Model royalties")).amount <
      0,
  );
  s = close(s);
  assert.equal(s.products[0].active, false);
  assert.equal(s.products[0].revenue, 0);
  assert.throws(() =>
    validate(s, {
      type: "launch",
      name: "Expired",
      modelId: "license01",
      price: 1100,
    }),
  );
});
test("untrusted action fields cannot replace generated project identity", () => {
  let s = createGame();
  s = move(s, { ...research, id: "forged", status: "complete", progress: 1 });
  s = close(s);
  assert.equal(s.projects[0].id, "move00001");
  assert.notEqual(s.projects[0].status, "complete");
});
test("prototype names cannot be interpreted as research catalogue entries", () => {
  assert.throws(
    () => design({ ...research, architecture: "constructor" }),
    /Choose/,
  );
});
