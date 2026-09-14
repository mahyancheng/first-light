import { design, date, cost } from "/engine.mjs";
let data = null,
  busy = false,
  notice = "",
  page = location.hash.slice(1) || "hq",
  poll = null;
const root = document.querySelector("#app");
const e = (v) =>
  String(v ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const money = (v) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: Math.abs(v) >= 1000000 ? "compact" : "standard",
  }).format(v || 0);
const full = (v) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v || 0);
const pct = (v) => `${Math.round(v * 100)}%`;
const navs = [
  ["hq", "01", "HQ"],
  ["lab", "02", "Lab"],
  ["business", "03", "Business"],
  ["industry", "04", "Industry"],
  ["decisions", "05", "Decisions"],
];
const btn = (label, attrs = "", type = "") =>
  `<button class="btn ${type}" ${attrs}>${label}</button>`;
const link = (label, to, type = "") =>
  `<a class="btn ${type}" href="#${to}">${label}</a>`;
const field = (label, name, value, type = "number", extra = "") =>
  `<label class="field">${label}<input name="${name}" type="${type}" value="${e(value)}" ${extra} required></label>`;
const select = (label, name, options) =>
  `<label class="field">${label}<select name="${name}">${Object.entries(options)
    .map(([id, x]) => `<option value="${e(id)}">${e(x.name ?? x)}</option>`)
    .join("")}</select></label>`;
const empty = (t) => `<p class="empty">${t}</p>`;
function head(kicker, title, body, action = "") {
  return `<header class="page-head"><div><div class="eyebrow">${kicker}</div><h1>${title}</h1><p>${body}</p></div>${action}</header>`;
}
function stats(items) {
  return `<div class="stats">${items.map(([label, value, note]) => `<div class="stat"><div class="eyebrow">${label}</div><div class="value">${value}</div><small>${note}</small></div>`).join("")}</div>`;
}
function landing() {
  return `<div class="landing"><div class="landing-story"><div class="brand"><i class="mark"></i>FIRST LIGHT</div><div><div class="eyebrow">A new era · 2023</div><h1>The future is<br>still <em>unwritten.</em></h1><p>A handful of people. One ambitious idea. An industry about to change everything.<br><br>Build an AI company—and decide what it becomes.</p></div><div class="landing-note">An original company strategy simulation.<br>Research, customers, capital and commitments. Every choice leaves a record.</div></div><div class="landing-form"><div class="panel"><span class="eyebrow">Your first day</span><h2>Make your opening move.</h2>${notice ? alertBox() : ""}<form data-form="found"><div class="fields">${field("Company name", "name", "Unwritten Labs", "text", 'maxlength="60"')}${field("Opening year", "year", "2023", "text", "disabled")}<label class="field full">What do you believe?<textarea name="thesis" maxlength="300" required placeholder="The opportunity others are missing…">Small, efficient models can make useful AI affordable.</textarea><small>Your thesis guides the conversation. You can choose any supported research path.</small></label></div><div class="funding"><strong>$4 million</strong> opening cash · 8 founding staff · 12 baseline compute units</div><div class="form-foot"><small>Start with a focused team. Customers and breakthroughs must be earned.</small>${btn("Found the company →", 'type="submit"', "primary")}</div></form></div></div></div>`;
}
function alertBox() {
  return `<div class="notice" role="status"><span>${e(notice)}</span><button data-dismiss aria-label="Dismiss notice">×</button></div>`;
}
function shell(body) {
  const s = data.state,
    o = data.overview;
  const active = page.split("/")[0];
  return `<div class="layout"><aside class="rail"><a href="#hq" class="brand"><i class="mark"></i>FIRST LIGHT</a><nav>${navs.map(([id, n, label]) => `<a href="#${id}" class="${id === active ? "active" : ""}" ${id === active ? 'aria-current="page"' : ""}><b>${n}</b>${label}${id === "decisions" && s.queue.length ? ` · ${s.queue.length}` : ""}</a>`).join("")}<a href="#chief" class="${active === "chief" ? "active" : ""}"><b>↗</b>Chief of Staff</a></nav><div class="rail-foot"><strong>${e(s.name)}</strong>${e(o.date)}<br>First Light · ${e(data.sha.slice(0, 7))}</div></aside><div><header class="topbar"><a class="company" href="#hq">${e(s.name)}</a><div class="top-meta"><span class="chip">${e(o.date)}</span>${link("Chief of Staff ↗", "chief")}</div></header><main class="content">${notice ? alertBox() : ""}${s.status !== "active" ? `<div class="notice">The company is in administration. Its decisions and accounts remain available.</div>` : ""}${body}<p class="footer-note">Fictional scenario economics · Server record ${s.revision} · ${e(o.date)}<br>Research scores and market parameters are game estimates, not historical benchmarks.</p></main></div><nav class="mobile-nav" aria-label="Game navigation">${navs.map(([id, n, label]) => `<a href="#${id}" class="${id === active ? "active" : ""}" ${id === active ? 'aria-current="page"' : ""}><b>${n}</b>${label}${id === "decisions" && s.queue.length ? ` (${s.queue.length})` : ""}</a>`).join("")}</nav></div>`;
}
function hq() {
  const s = data.state,
    o = data.overview,
    last = s.history.at(-1);
  return (
    head(
      "The founder’s office",
      s.quarter === 0 ? "Everything starts here." : "Your next chapter.",
      e(s.thesis),
      link("Review decisions →", "decisions", "primary"),
    ) +
    stats([
      ["Cash available", money(s.cash), "Funds in the company"],
      [
        "Quarterly revenue",
        money(o.revenue),
        last ? "Last closed quarter" : "No quarter closed yet",
      ],
      [
        "Runway",
        o.runway === null ? "Self-funded" : `${o.runway.toFixed(1)} qtrs`,
        "At current recurring costs",
      ],
      ["Founder ownership", pct(s.equity), "After completed funding rounds"],
    ]) +
    `<div class="grid two"><section class="panel hero"><span class="orbit" aria-hidden="true"></span><div><div class="eyebrow">The current challenge</div><h2>${e(o.journey.name)}</h2><p>${e(o.journey.goal)}</p></div>${link("Make your next move →", o.journey.place)}</section><section class="panel"><div class="section-title"><h2>A company takes shape</h2><span class="eyebrow">Your journey</span></div><ol class="path">${[
      [
        "A working idea",
        "Complete your first research programme.",
        s.models.length,
      ],
      [
        "A product in the world",
        "Launch a model and serve customers.",
        s.products.some((p) => p.customers > 0),
      ],
      [
        "A sustainable business",
        "Close a profitable operating quarter.",
        s.history.some((h) => h.profit > 0),
      ],
      [
        "A position that matters",
        "Own differentiated models and recurring demand.",
        s.models.length >= 3 && o.revenue >= 1000000,
      ],
    ]
      .map(
        ([a, b, c], i) =>
          `<li class="${c ? "done" : ""}"><span class="number">${c ? "✓" : i + 1}</span><div><strong>${a}</strong><small>${b}</small></div></li>`,
      )
      .join(
        "",
      )}</ol></section></div><section class="section"><div class="section-title"><h2>${last ? "What changed" : "The work ahead"}</h2>${last ? link("Read the quarter →", "decisions/report") : link("Open the lab →", "lab")}</div><div class="grid equal"><div class="panel">${
      last
        ? last.log
            .filter((x) => x.kind === "research" || x.kind === "sales")
            .slice(0, 4)
            .map(
              (x) =>
                `<div class="row"><div><strong>${e(x.text)}</strong></div>${x.amount ? `<span class="mono">${money(x.amount)}</span>` : ""}</div>`,
            )
            .join("") ||
          empty("This quarter was spent building operating foundations.")
        : empty(
            "Your lab is ready. Choose an architecture, a training approach and the customer problem you want to solve. Nothing has been queued for you.",
          )
    }</div><div class="panel"><div class="conversation-title"><span class="avatar">CS</span><div><h3>Your Chief of Staff</h3><small>Think through the trade-offs. Review every move.</small></div></div><p class="muted spaced">“${s.models.length ? "How do we turn our research into a business that lasts?" : "What could we build with this team and this much runway?"}”</p><div class="spaced">${link("Open the conversation", "chief", "dark")}</div></div></div></section>`
  );
}
function lab() {
  const s = data.state,
    c = data.catalog;
  return (
    head(
      "Research & development",
      "Choose your edge.",
      "Design the intelligence, not just a research budget. Architecture, training and output determine what your team must build.",
    ) +
    `<div class="grid two"><section class="panel"><div class="section-title"><h2>Design a programme</h2><span class="chip">Research brief</span></div><form data-form="research"><div class="fields">${field("Programme name", "name", "Small model, serious work", "text", 'maxlength="100"')}${select("Output market", "output", c.markets)}${select("Architecture", "architecture", c.architectures)}${select("Training approach", "method", c.methods)}${field("Model size · billion parameters", "scale", 7, "number", 'min="1" max="70" step="1"')}${select("Data investment", "data", { 1: "Basic licensed corpus", 2: "Curated domain corpus", 3: "Expert-labelled dataset", 4: "Broad evaluation programme", 5: "Deep proprietary dataset" })}</div><div id="design-preview"></div><div class="form-foot"><small>Research is uncertain. Costs are paid when the programme starts; progress requires staff and compute each quarter.</small>${btn("Add research to decisions →", 'type="submit"', "primary")}</div></form></section><div class="grid"><section class="blueprint"><div class="tagline">From hypothesis to capability</div><div class="nodes"><span class="node">Data</span><i class="connector"></i><span class="node">Training</span><i class="connector"></i><span class="node">Evaluation</span></div><small>A benchmark result becomes a model.<br>A model still needs a product and customers.</small></section><section class="panel"><h2>Lab capacity</h2><div class="row"><strong>Research team</strong><span class="mono">${s.staff.research} people</span></div><div class="row"><strong>Compute this quarter</strong><span class="mono">${o().compute} units</span></div><small>Active programmes share researchers. Research reserves compute before products receive serving capacity.</small><div class="spread spaced">${link("Hire researchers", "business/team")}${link("Negotiate compute", "industry")}</div></section></div></div><section class="section"><div class="section-title"><h2>Work in progress</h2><small>Progress is earned when a quarter resolves.</small></div>${s.projects.length ? `<div class="grid equal">${s.projects.map((p) => `<article class="panel"><div class="section-title"><h3>${e(p.name)}</h3><span class="chip ${p.status === "complete" ? "good" : ""}">${e(p.status)}</span></div><small>${e(c.architectures[p.architecture].name)} · ${e(c.methods[p.method].name)} · ${e(c.markets[p.output].name)}</small><progress max="1" value="${p.progress}">${pct(p.progress)}</progress><div class="row"><span class="mono">${pct(p.progress)}</span><small>${p.compute} compute units · ${full(p.budget)} setup</small></div>${p.status === "active" ? btn("Stop programme", `data-cancel-research="${e(p.id)}"`) : ""}</article>`).join("")}</div>` : empty("No programmes yet. Write your first research brief above.")}</section><section class="section"><div class="section-title"><h2>Your model library</h2><small>Completed and validated research.</small></div>${s.models.length ? `<div class="grid three">${s.models.map((m) => `<article class="panel"><span class="eyebrow">${e(m.output)}</span><h2 class="spaced">${e(m.name)}</h2><div class="row"><small>Capability score</small><span class="value">${m.quality}<small>/100</small></span></div><small>${m.scale}B parameters · ${e(c.architectures[m.architecture].name)}<br>Serving factor ${m.serve.toFixed(2)}×</small><div class="spaced">${link("Build a product →", "business")}</div></article>`).join("")}</div>` : empty("Completed programmes will appear here with their measured capability and serving economics.")}</section>`
  );
}
const o = () => data.overview;
function tabs(items, active) {
  return `<nav class="section-nav">${items.map(([id, label]) => `<a href="#business${id ? "/" + id : ""}" class="${id === active ? "active" : ""}">${label}</a>`).join("")}</nav>`;
}
function business() {
  const s = data.state,
    sub = page.split("/")[1] || "";
  let body = "";
  if (sub === "team")
    body = `<div class="grid equal"><section class="panel"><h2>People make the company</h2>${Object.entries(
      s.staff,
    )
      .map(
        ([role, n]) =>
          `<div class="row"><strong>${e(role[0].toUpperCase() + role.slice(1))}</strong><span class="value">${n}</span></div>`,
      )
      .join(
        "",
      )}<p class="muted spaced">Researchers advance programmes. Engineers support paying accounts. Salespeople build awareness.</p><div class="funding">Quarterly payroll: <strong>${full(o().payroll)}</strong></div></section><section class="panel"><h2>Open a requisition</h2><form data-form="hire"><div class="fields">${select("Role", "role", { research: "Research", engineering: "Engineering", sales: "Sales" })}${field("People", "count", 2, "number", 'min="1" max="50"')}</div><p class="muted spaced">Recruiting costs $15,000 per person. Hires join the following quarter. Annual compensation: research $240k, engineering $192k, sales $144k.</p><div class="form-foot">${btn("Review hiring →", 'type="submit"', "primary")}</div></form>${s.hires.length ? `<div class="spaced">${s.hires.map((h) => `<div class="row"><strong>${h.count} ${e(h.role)}</strong><small>Arriving ${date(h.arrives)}</small></div>`).join("")}</div>` : ""}<details class="well"><summary>Reduce headcount</summary><form data-form="layoff" class="spaced"><div class="fields">${select("Role", "role", { research: "Research", engineering: "Engineering", sales: "Sales" })}${field("People", "count", 1, "number", 'min="1" max="50"')}</div><small>Severance costs $20,000 per person. Layoffs reduce trust.</small><div class="spaced">${btn("Review reduction", 'type="submit"', "danger")}</div></form></details></section></div>`;
  else if (sub === "capital")
    body = `<div class="grid equal"><section class="panel"><h2>Raise with a purpose</h2><form data-form="raise"><div class="fields">${field("New investment · USD", "amount", 1000000, "number", 'min="100000" max="10000000" step="100000"')}${field("Pre-money valuation · USD", "valuation", 4000000, "number", 'min="500000" max="100000000" step="100000"')}</div><p class="muted spaced">Investors value demonstrated models and revenue. An ambitious valuation can be refused. A successful round dilutes your ownership.</p><div class="form-foot">${btn("Put the round to investors →", 'type="submit"', "primary")}</div></form></section><section class="panel"><h2>Borrow against the business</h2><form data-form="borrow">${field("Loan amount · USD", "amount", 300000, "number", 'min="100000" max="3000000" step="100000"')}<p class="muted spaced">12% annual interest. 5% of outstanding principal repaid each quarter. The lender checks revenue and existing debt.</p><div class="form-foot">${btn("Request a loan", 'type="submit"')}</div></form><div class="funding">Outstanding debt: <strong>${full(s.debt)}</strong><br>Founder ownership: <strong>${pct(s.equity)}</strong></div></section></div>`;
  else
    body = `<div class="grid equal"><section class="panel"><h2>Bring a model to market</h2>${s.models.length ? `<form data-form="launch"><div class="fields">${field("Product name", "name", "A useful first product", "text", 'maxlength="100"')}${select("Model", "modelId", Object.fromEntries(s.models.map((m) => [m.id, m.name])))}${field("Price per customer per quarter · USD", "price", 1200, "number", 'min="100" max="25000" step="100"')}</div><p class="muted spaced">Launch setup costs $75,000. Demand depends on quality, price, awareness and trust. Compute and engineering capacity limit fulfilment.</p><div class="form-foot">${btn("Review product launch →", 'type="submit"', "primary")}</div></form>` : empty("You need a validated model before launching. Complete a programme in the Lab, then return here.")}</section><section class="panel"><h2>The operating constraints</h2><div class="row"><strong>Engineers</strong><span class="mono">${s.staff.engineering} · up to ${s.staff.engineering * 650} accounts</span></div><div class="row"><strong>Compute capacity</strong><span class="mono">${o().compute} units</span></div><div class="row"><strong>Customer trust</strong><span class="mono">${s.trust}/100</span></div><small>Accounts are quarterly subscriptions. Unserved demand earns nothing and harms trust. Reserved compute is billed even when idle.</small><div class="spaced">${link("Secure more capacity →", "industry")}</div></section></div><section class="section"><div class="section-title"><h2>Products in the world</h2><small>Revenue reflects the last resolved quarter.</small></div>${s.products.length ? `<div class="grid equal">${s.products.map((p) => `<article class="panel"><div class="section-title"><h2>${e(p.name)}</h2><span class="chip">${p.active ? "Live" : "Sunset"}</span></div><div class="grid three"><div><small>Customers served</small><div class="value">${p.customers}</div></div><div><small>Quarterly revenue</small><div class="value">${money(p.revenue)}</div></div><div><small>Price / quarter</small><div class="value">${money(p.price)}</div></div></div>${p.active ? `<details class="well"><summary>Adjust price & distribution</summary><form data-form="price" class="spaced"><input type="hidden" name="productId" value="${e(p.id)}">${field("New quarterly price", "price", p.price, "number", 'min="100" max="25000"')}<div class="spaced">${btn("Review price change", 'type="submit"')}</div></form><form data-form="marketing" class="spaced"><input type="hidden" name="productId" value="${e(p.id)}">${field("Customer acquisition budget", "budget", 50000, "number", 'min="10000" max="1000000" step="10000"')}<div class="spaced">${btn("Review campaign", 'type="submit"')}</div></form><div class="spaced">${btn("Sunset product", `data-sunset="${e(p.id)}"`, "danger")}</div></details>` : ""}</article>`).join("")}</div>` : empty("No products launched. The world will judge what you deliver, not what you announce.")}</section>`;
  return (
    head(
      "Company operations",
      "Build something that lasts.",
      "Connect the product to customers, the team to delivery, and capital to a purpose.",
    ) +
    tabs(
      [
        ["", "Products"],
        ["team", "Team"],
        ["capital", "Capital"],
      ],
      sub,
    ) +
    body
  );
}
function chat(counterparty) {
  const s = data.state,
    supplier =
      data.catalog.suppliers.find((x) => x.id === counterparty) ||
      (() => {
        const r = s.rivals.find((x) => x.id === counterparty);
        return r ? { person: r.name, role: "Founder & model licensing" } : null;
      })(),
    messages = s.chats.filter((c) => c.counterparty === counterparty);
  return `<section class="panel"><div class="conversation-title"><span class="avatar">${
    supplier
      ? e(
          supplier.person
            .split(" ")
            .map((x) => x[0])
            .join(""),
        )
      : "CS"
  }</span><div><h2>${supplier ? e(supplier.person) : "Chief of Staff"}</h2><small>${supplier ? e(supplier.role) : "Your advisor. Your decisions."}</small></div></div><div class="chat-log">${messages.map((c) => `<div class="message you"><small>YOU · ${date(c.quarter)}</small>${e(c.message)}</div>${c.status === "pending" ? '<p class="loading-line" role="status">Reply in progress. Your message is saved; you can keep playing.</p>' : `<div class="message"><small>${c.status === "failed" ? "SERVICE STATUS" : supplier ? e(supplier.person.toUpperCase()) : "CHIEF OF STAFF"}</small>${e(c.reply)}</div>`}${(c.proposals ?? []).map((p, i) => `<div class="offer"><h3>${e(p.label)}</h3><p>${e(p.reason)}</p>${btn("Add to decisions →", `data-proposal="${e(c.id)}" data-index="${i}"`, "primary")}</div>`).join("")}`).join("") || empty(supplier ? "Discuss the trade-offs here. Use Request terms to obtain an executable quote with exact quantities, pricing and dates." : "Ask about your strategy, costs or next moves. Supported proposals can be added to Decisions for review.")}</div><form class="chat-compose" data-form="chat"><input type="hidden" name="counterparty" value="${e(counterparty)}"><label class="field">${supplier ? "Your message" : "What are you trying to achieve?"}<textarea name="message" maxlength="3000" required placeholder="Describe the outcome you want…"></textarea></label>${btn("Send message →", 'type="submit"', "dark")}<small class="spaced">${data.ai ? "Live replies may take a minute. Actions always require your review." : "Live advisor is not connected. Structured game controls remain available."}</small></form></section>`;
}
function industry() {
  const s = data.state,
    which = page.split("/")[1] || "northstar",
    supplier =
      data.catalog.suppliers.find((x) => x.id === which) ||
      data.catalog.suppliers[0];
  const rival = s.rivals.find((r) => r.id === which);
  if (rival) return rivalWorkspace(rival);
  return (
    head(
      "The industry",
      "Nobody builds alone.",
      "Negotiate the resources your strategy needs. Counterparties have prices, constraints and interests of their own.",
    ) +
    `<nav class="section-nav">${data.catalog.suppliers.map((x) => `<a href="#industry/${x.id}" class="${x.id === supplier.id ? "active" : ""}">${e(x.name)}</a>`).join("")}</nav><div class="grid equal"><section class="panel"><span class="eyebrow">${e(supplier.name)}</span><h2 class="spaced">Reserve a place in the cluster.</h2><p class="muted">${e(supplier.description)}</p><form class="spaced" data-form="quote"><input type="hidden" name="supplier" value="${supplier.id}"><div class="fields">${field("Compute units per quarter", "units", 20, "number", `min="1" max="${supplier.capacity}"`)}${field("Duration · quarters", "duration", 4, "number", 'min="1" max="16"')}${field("Price cap / unit / quarter · USD", "price", supplier.price, "number", 'min="1000" max="50000" step="100"')}${select("Delivery starts", "start", Object.fromEntries(Array.from({ length: 5 }, (_, i) => [s.quarter + i, date(s.quarter + i)])))}${select("Cancellation terms", "cancellable", { false: "Firm commitment", true: "Cancellable · one quarter fee" })}</div><div class="form-foot"><small>Quotes may counter your price or quantity. Review the exact terms before accepting.</small>${btn("Request terms →", 'type="submit"', "primary")}</div></form>${s.offers
      .filter(
        (x) =>
          x.supplier === supplier.id &&
          x.status === "offered" &&
          x.expires >= s.quarter,
      )
      .slice(-2)
      .reverse()
      .map(
        (x) =>
          `<article class="offer"><h3>${x.withinBudget ? "Offer ready for review" : "Counteroffer"}</h3><div class="terms"><div><small>Quantity</small>${x.units} units / quarter</div><div><small>Unit price</small>${full(x.price)}</div><div><small>Delivery</small>${date(x.start)} → ${date(x.end)}</div><div><small>Total commitment</small>${full(x.total)}</div><div><small>Cancellation</small>${x.cancellable ? "One quarter fee" : "Non-cancellable"}</div><div><small>Quarterly bill</small>${full(x.quarterly)}</div></div><p>${e(x.reason)}</p>${btn("Review acceptance →", `data-accept="${e(x.id)}"`, "primary")}</article>`,
      )
      .join(
        "",
      )}</section>${chat(supplier.id)}</div><section class="section"><div class="section-title"><h2>Your supply commitments</h2><small>Accepted contracts consume supplier capacity.</small></div>${s.contracts.length ? `<div class="panel">${s.contracts.map((c) => `<div class="row"><div><strong>${e(data.catalog.suppliers.find((x) => x.id === c.supplier)?.name)} · ${c.units} units</strong><small>${date(c.start)} → ${date(c.end)} · ${e(c.status)} · ${c.cancellable ? "Cancellable" : "Firm"}</small></div><div class="right"><span class="mono">${full(c.quarterly)}/qtr</span>${c.status === "active" && c.cancellable ? `<div>${btn("Review cancellation", `data-cancel-contract="${e(c.id)}"`)}</div>` : ""}</div></div>`).join("")}</div>` : empty("No commitments yet. A conversation is not a contract; accepted terms will appear here.")}</section><section class="section"><div class="section-title"><h2>The competitive landscape</h2><small>Public product positions, not private company accounts.</small></div><div class="grid three">${s.rivals.map((r) => `<article class="panel"><span class="eyebrow">${e(data.catalog.markets[r.output].name)}</span><h2 class="spaced">${e(r.name)}</h2><div class="row"><small>Published capability</small><span class="mono">${r.quality.toFixed(0)}/100</span></div><div class="row"><small>Quarterly price</small><span class="mono">${full(r.price)}</span></div><div class="row"><small>Accounts served</small><span class="mono">${r.customers}</span></div><div class="spaced">${link("Talk & license →", `industry/${r.id}`, "dark")}</div></article>`).join("")}</div></section>`
  );
}
const describe = (a) => {
  const s = data.state;
  switch (a.type) {
    case "research":
      return `${a.name} · ${a.architecture} · ${a.method} · ${a.output} · ${a.scale}B parameters`;
    case "hire":
    case "layoff":
      return `${a.count} ${a.role} staff`;
    case "launch":
      return `${a.name} · ${full(a.price)} per account / quarter`;
    case "raise":
      return `${full(a.amount)} at ${full(a.valuation)} pre-money`;
    case "borrow":
      return `${full(a.amount)} · 12% annual interest`;
    case "license_model": {
      const x = s.licenseOffers?.find((o) => o.id === a.offerId);
      return x
        ? `${x.companyName} · ${full(x.fee)} upfront + ${x.royalty}% revenue · ${x.duration} quarters`
        : "Licence unavailable";
    }
    case "accept_offer": {
      const x = s.offers.find((o) => o.id === a.offerId);
      return x
        ? `${x.units} compute units × ${x.duration} quarters · ${full(x.total)} total obligation`
        : "Offer no longer available";
    }
    case "marketing":
      return `${full(a.budget)} customer acquisition campaign`;
    case "price":
      return `${full(a.price)} per account / quarter`;
    default:
      return a.type.replaceAll("_", " ");
  }
};
function report(h) {
  if (!h)
    return empty(
      "Close your first quarter to see its complete operating account.",
    );
  return `<div class="section-title"><h2>${date(h.quarter)} · The record</h2><span class="chip">Closed</span></div><div class="grid equal"><section class="panel"><h2>Where the money went</h2><table class="ledger"><tbody>${[
    ["Opening cash", h.opening],
    ["Revenue from served customers", h.revenue],
    ["Operating costs", -h.opex],
    ["New investments & setup", -h.investment],
    ["New financing", h.financing],
    ["Debt principal", -h.principal],
    ["Closing cash", h.closing],
  ]
    .map(
      ([label, v], i) =>
        `<tr class="${i === 6 ? "total" : ""}"><td>${label}</td><td class="mono">${full(v)}</td></tr>`,
    )
    .join(
      "",
    )}</tbody></table><small>Opening cash + inflows − outflows = closing cash.</small></section><section class="panel"><h2>Decisions & consequences</h2>${h.receipts.map((r) => `<div class="receipt"><span class="chip ${r.status === "executed" ? "good" : "bad"}">${r.status === "executed" ? "Committed" : "Rejected"}</span><div><strong>${e(r.type.replaceAll("_", " "))}</strong><p>${e(r.text)}</p></div></div>`).join("") || empty("No discretionary moves this quarter. The company and competitors continued operating.")}</section></div><section class="panel section"><h2>The operating journal</h2>${h.log.map((l) => `<div class="row"><div><strong>${e(l.text)}</strong><small>${e(l.kind)}</small></div>${l.amount ? `<span class="mono ${l.amount < 0 ? "bad-text" : "good-text"}">${money(l.amount)}</span>` : ""}</div>`).join("")}</section>`;
}
function decisions() {
  const s = data.state,
    total = s.queue.reduce((n, x) => n + cost(s, x.action), 0),
    reportMode = page.includes("/report");
  if (reportMode)
    return (
      head(
        "The company record",
        "Consequences, made visible.",
        "A complete account of what happened—not just a success message.",
        link("Back to decisions", "decisions"),
      ) + report(s.history.at(-1))
    );
  return (
    head(
      "The commitment desk",
      "Make the call.",
      "Review what you are asking the company to attempt. The world responds when you close the quarter.",
    ) +
    stats([
      ["Decisions", s.queue.length, "Moves waiting for your approval"],
      ["Current cash", money(s.cash), "Before the quarter operates"],
      ["Upfront estimates", money(total), "Includes first bill on new supply"],
      ["Recurring payroll", money(o().payroll), "Before compute and overhead"],
    ]) +
    `<div class="grid two"><section class="panel"><h2>Ready for your decision</h2>${s.queue.length ? s.queue.map((x) => `<div class="row"><div><strong>${e(x.action.type.replaceAll("_", " "))}</strong><small>${e(describe(x.action))}</small><small>Estimated initial cost: ${full(cost(s, x.action))}</small></div>${btn("Remove", `data-remove="${e(x.id)}"`)}</div>`).join("") : empty("There are no new moves in this quarter. Existing payroll, research, products and contracts will still run.")}<div class="well"><p>Each move is revalidated in order. Cash and capacity are shared across decisions. A rejected move is recorded with its reason; it cannot silently execute. Financing attempts can be declined.</p></div></section><section class="panel"><span class="eyebrow">${date(s.quarter)}</span><h2 class="spaced">Let the world respond.</h2><p class="muted">Research advances. Customers choose. Contracts deliver. The team gets paid. Competitors continue building.</p><div class="funding">Existing obligations continue even if you queue nothing. Future revenue is uncertain.</div><form data-form="resolve" class="spaced"><label class="field">Confirm this quarter<select name="confirm" required><option value="">Review first…</option><option value="yes">Commit these decisions and advance</option></select></label><div class="spaced">${btn(`Close ${date(s.quarter)} →`, 'type="submit"', "primary fullwidth")}</div></form><div class="spaced">${link("Ask the Chief of Staff", "chief")}</div></section></div>${s.history.length ? `<section class="section">${report(s.history.at(-1))}</section>` : ""}`
  );
}
function render() {
  const active = document.activeElement;
  const focusName = active?.name;
  const focusForm = active?.closest("form");
  const focusIndex = focusForm
    ? [...document.querySelectorAll("form")].indexOf(focusForm)
    : -1;
  const selection = active?.selectionStart ?? null;

  const drafts = [...document.querySelectorAll("form")].map((f) => ({
    key: f.dataset.form + (f.querySelector("[name=counterparty]")?.value || ""),
    values: [...f.elements].filter((x) => x.name).map((x) => [x.name, x.value]),
  }));
  if (!data) return;
  root.innerHTML = data.state
    ? shell(
        page.startsWith("lab")
          ? lab()
          : page.startsWith("business")
            ? business()
            : page.startsWith("industry")
              ? industry()
              : page.startsWith("decisions")
                ? decisions()
                : page === "chief"
                  ? head(
                      "Your Chief of Staff",
                      "Think it through.",
                      "An advisor who can propose moves. You remain the decision-maker.",
                    ) + chat("chief")
                  : hq(),
      )
    : landing();
  for (const f of document.querySelectorAll("form")) {
    const d = drafts.find(
      (x) =>
        x.key ===
        f.dataset.form + (f.querySelector("[name=counterparty]")?.value || ""),
    );
    if (d)
      for (const [name, value] of d.values) {
        const el = f.elements.namedItem(name);
        if (el && !el.disabled && el.type !== "hidden") el.value = value;
      }
  }
  document
    .querySelectorAll("button[type=submit]")
    .forEach((b) => (b.disabled = busy));
  preview();
  const focusTarget =
    focusIndex >= 0
      ? document
          .querySelectorAll("form")
          [focusIndex]?.elements.namedItem(focusName)
      : null;
  if (focusTarget) {
    focusTarget.focus({ preventScroll: true });
    if (
      selection !== null &&
      typeof focusTarget.setSelectionRange === "function"
    ) {
      try {
        focusTarget.setSelectionRange(selection, selection);
      } catch {}
    }
  }
}
function preview() {
  const f = document.querySelector("[data-form=research]"),
    el = document.querySelector("#design-preview");
  if (!f || !el) return;
  try {
    const a = formData(f),
      d = design(a);
    el.innerHTML = `<div class="preview"><div class="grid three"><div><small>Programme setup</small><strong>${money(d.budget)}</strong></div><div><small>Compute per quarter</small><strong>${d.compute} units</strong></div><div><small>Minimum duration*</small><strong>${Math.ceil(d.work / Math.max(1, data.state.staff.research))} qtrs</strong></div></div><p>${e(data.catalog.architectures[a.architecture].note)} ${e(data.catalog.methods[a.method].note)}</p><p>*At current staff, full compute allocation and no other active programmes. Validation setbacks can extend the work.</p></div>`;
  } catch (err) {
    el.innerHTML = `<div class="notice">${e(err.message)}</div>`;
  }
}
function formData(f) {
  const b = Object.fromEntries(new FormData(f));
  for (const k of [
    "scale",
    "data",
    "count",
    "price",
    "budget",
    "amount",
    "valuation",
    "units",
    "duration",
    "start",
    "fee",
    "royalty",
  ])
    if (k in b) b[k] = Number(b[k]);
  if ("cancellable" in b) b.cancellable = b.cancellable === "true";
  return b;
}
async function refresh() {
  const previousRevision = data?.state?.revision;
  const r = await fetch("/api/state");
  if (!r.ok)
    throw Error(
      "The company could not be loaded. Check your connection and retry.",
    );
  data = await r.json();
  if (
    previousRevision !== data.state?.revision ||
    !root.querySelector(".layout")
  )
    render();
  clearTimeout(poll);
  if (data.state?.chats.some((c) => c.status === "pending"))
    poll = setTimeout(() => refresh().catch(showError), 2500);
}
function showError(err) {
  notice = err.message;
  render();
}
async function mutate(path, body = {}) {
  if (busy) return;
  if (sessionStorage.getItem("firstlight-pending")) {
    notice =
      "A previous delivery is unresolved. Refresh to reconcile it before submitting another move.";
    render();
    return false;
  }
  busy = true;
  notice = "";
  const request = {
    id: Array.from(crypto.getRandomValues(new Uint8Array(16)), (x) =>
      x.toString(16).padStart(2, "0"),
    ).join(""),
    revision: data.state?.revision,
    ...body,
  };
  sessionStorage.setItem(
    "firstlight-pending",
    JSON.stringify({ path, request }),
  );
  render();
  try {
    const r = await fetch("/api/" + path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    });
    const result = await r.json();
    if (!r.ok) {
      sessionStorage.removeItem("firstlight-pending");
      throw Error(result.error || "Request failed.");
    }
    sessionStorage.removeItem("firstlight-pending");
    await refresh();
    return true;
  } catch (err) {
    notice = err.message;
    if (sessionStorage.getItem("firstlight-pending"))
      notice =
        "Delivery is uncertain. Refresh this page to reconcile the saved request; do not submit it again.";
    await refresh().catch(() => {});
    return false;
  } finally {
    busy = false;
    render();
  }
}
root.addEventListener("input", preview);
root.addEventListener("submit", async (event) => {
  const f = event.target.closest("form");
  if (!f) return;
  event.preventDefault();
  const kind = f.dataset.form,
    b = formData(f);
  let ok;
  if (kind === "found") {
    delete b.year;
    ok = await mutate("found", b);
  } else if (kind === "resolve") {
    if (b.confirm !== "yes") return;
    ok = await mutate("resolve");
    if (ok) location.hash = "decisions/report";
  } else if (kind === "quote" || kind === "license-quote") {
    ok = await mutate(kind, b);
    if (ok)
      notice = "Supplier terms are ready below. Nothing has been accepted.";
  } else if (kind === "chat") {
    ok = await mutate("chat", b);
    if (ok) {
      const current = document.querySelector(`[data-form=chat] textarea`);
      if (current) current.value = "";
    }
  } else {
    ok = await mutate("stage", { action: { type: kind, ...b } });
    if (ok)
      notice =
        "Added to Decisions. It will be attempted when you commit the quarter.";
  }
  render();
});
root.addEventListener("click", async (event) => {
  const b = event.target.closest("button");
  if (!b) return;
  if (b.hasAttribute("data-dismiss")) {
    notice = "";
    render();
    return;
  }
  let action;
  if (b.dataset.remove) {
    await mutate("remove", { actionId: b.dataset.remove });
    return;
  }
  if (b.dataset.license)
    action = { type: "license_model", offerId: b.dataset.license };
  if (b.dataset.accept)
    action = { type: "accept_offer", offerId: b.dataset.accept };
  if (b.dataset.cancelResearch)
    action = { type: "cancel_research", projectId: b.dataset.cancelResearch };
  if (b.dataset.cancelContract)
    action = { type: "cancel_contract", contractId: b.dataset.cancelContract };
  if (b.dataset.sunset)
    action = { type: "sunset", productId: b.dataset.sunset };
  if (b.dataset.proposal)
    action = data.state.chats.find((c) => c.id === b.dataset.proposal)
      ?.proposals[Number(b.dataset.index)]?.action;
  if (action) {
    if (await mutate("stage", { action })) {
      notice = "Added to Decisions for your review.";
      render();
    }
  }
});
addEventListener("hashchange", () => {
  page = location.hash.slice(1) || "hq";
  root.innerHTML = "";
  render();
  scrollTo({ top: 0, behavior: "instant" });
});
async function start() {
  try {
    await refresh();
    const stored = sessionStorage.getItem("firstlight-pending");
    if (stored) {
      const { path, request } = JSON.parse(stored);
      const r = await fetch("/api/" + path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      if (r.ok) {
        sessionStorage.removeItem("firstlight-pending");
        notice = "Your previous request was reconciled successfully.";
      } else {
        const result = await r.json();
        sessionStorage.removeItem("firstlight-pending");
        notice = result.error || "The previous request was not committed.";
      }
      await refresh();
    }
  } catch (err) {
    root.innerHTML = `<div class="boot">FIRST LIGHT<span>${e(err.message)}</span><a href="/" class="btn">Retry connection</a></div>`;
  }
}
start();

function rivalWorkspace(r) {
  const s = data.state;
  return (
    head(
      "Company conversations",
      e(r.name),
      "A competitor can also be a supplier. Negotiate rights to its model, or build an independent alternative.",
      link("All companies", "industry"),
    ) +
    `<div class="grid equal"><section class="panel"><span class="eyebrow">${e(data.catalog.markets[r.output].name)}</span><h2 class="spaced">Build on their foundation.</h2><p class="muted">A non-exclusive licence grants commercial use for a fixed term. Upfront fees and royalties are paid to the other company. The model does not become your intellectual property.</p><form class="spaced" data-form="license-quote"><input type="hidden" name="companyId" value="${e(r.id)}"><div class="fields">${field("Upfront fee cap · USD", "fee", 300000, "number", 'min="0" max="3000000" step="10000"')}${field("Revenue royalty cap · %", "royalty", 10, "number", 'min="0" max="30"')}${field("Licence term · quarters", "duration", 8, "number", 'min="2" max="20"')}</div><div class="form-foot">${btn("Request licensing terms →", 'type="submit"', "primary")}</div></form>${(
      s.licenseOffers ?? []
    )
      .filter(
        (x) =>
          x.companyId === r.id &&
          x.status === "offered" &&
          x.expires >= s.quarter,
      )
      .slice(-2)
      .reverse()
      .map(
        (x) =>
          `<article class="offer"><h3>${x.withinBudget ? "Licence offer" : "Licensing counteroffer"}</h3><div class="terms"><div><small>Upfront fee</small>${full(x.fee)}</div><div><small>Revenue royalty</small>${x.royalty}%</div><div><small>Term from acceptance</small>${x.duration} quarters</div><div><small>Rights</small>Non-exclusive commercial use</div></div><p>${x.withinBudget ? "Terms meet your caps. Review before committing." : "These terms exceed at least one of your caps. They have not been accepted."}</p>${btn("Review licence acceptance →", `data-license="${e(x.id)}"`, "primary")}</article>`,
      )
      .join(
        "",
      )}</section>${chat(r.id)}</div><section class="panel section"><h2>Your licensed models</h2>${
      (s.licenses ?? [])
        .filter((l) => l.companyId === r.id)
        .map(
          (l) =>
            `<div class="row"><div><strong>${e(l.companyName)} · ${e(l.output)}</strong><small>${date(l.start)} → ${date(l.end)} · ${l.royalty}% of product revenue</small></div>${link("Build a product", "business")}</div>`,
        )
        .join("") ||
      empty(
        "No licence accepted from this company. The conversation itself cannot create one.",
      )
    }</section>`
  );
}
