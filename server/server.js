// server.js — backend for yusufshoots.com
// Express + JSON-file storage + Stripe Checkout. No build step, no native deps.
//
// Env vars (see ../.env.example):
//   ADMIN_PASSWORD        required — Studio login
//   STRIPE_SECRET_KEY     required for payments (sk_live_… / sk_test_…)
//   STRIPE_WEBHOOK_SECRET required for payment confirmation (whsec_…)
//   PUBLIC_URL            e.g. https://yusufshoots.com (used for Stripe redirects)
//   PORT                  default 8080
//   DATA_DIR              default /data (Docker volume)
//   SITE_DIR              default ./site (static frontend)

const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 8080;
const DATA_DIR = process.env.DATA_DIR || "/data";
const SITE_DIR = process.env.SITE_DIR || path.join(__dirname, "site");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const DB_FILE = path.join(DATA_DIR, "db.json");
const PUBLIC_URL = (process.env.PUBLIC_URL || "http://localhost:" + PORT).replace(/\/$/, "");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const MIN_LEAD_DAYS = 7;
// How long a date is soft-held for someone mid-checkout, before it's free again for
// someone else. Kept a few minutes longer than the Stripe session below so our own
// hold always outlives Stripe's — never the other way round.
const HOLD_MINUTES = 35;
const STRIPE_SESSION_MINUTES = 30; // Stripe's own floor — it rejects anything shorter

const stripe = process.env.STRIPE_SECRET_KEY ? require("stripe")(process.env.STRIPE_SECRET_KEY) : null;

// ---------- packages (authoritative prices — must match the frontend display) ----------
const PACKAGES = {
  photo: { p1: { name: "Essential", price: 350 }, p2: { name: "Signature", price: 600 }, p3: { name: "Bespoke", price: null } },
  both:  { b1: { name: "Essential", price: 800 }, b2: { name: "Signature", price: 1400 }, b3: { name: "Premier", price: 2000 } },
  film:  { f1: { name: "Essential", price: 550 }, f2: { name: "Signature", price: 1100 }, f3: { name: "Bespoke", price: null } },
};
const COVERAGE_NAMES = { photo: "Photography", film: "Cinematography", both: "Photography & Cinematography" };

// ---------- storage ----------
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const U = (id) => id; // photo entries stay as unsplash ids or /u/ urls; frontend resolves
function seedDb() {
  return {
    site: {
      hero: "https://cdn.myportfolio.com/b785e00f-afc3-4a6b-9014-8d913373f4e0/5e0fbe8b-2ac9-42bd-9a51-52c2117d32e7_rwc_0x0x3855x6853x3855.jpg?h=6c12872659984e3373bd413a36e2d564",
      photos: [
        { src: "1519741497674-611481863552", ratio: "4/5", label: "Ceremony rings" },
        { src: "1606216794074-735e91aa2c92", ratio: "3/4", label: "Mehndi detail" },
        { src: "1537633552985-df8429e8048b", ratio: "4/3", label: "Golden hour" },
        { src: "1519225421980-715cb0215aed", ratio: "3/4", label: "First dance" },
        { src: "1583939003579-730e3918a45a", ratio: "4/5", label: "Bridal portrait" },
        { src: "1522673607200-164d1b6ce486", ratio: "3/2", label: "The couple" },
        { src: "1465495976277-4387d4b0b4c6", ratio: "4/3", label: "Reception toast" },
        { src: "1511285560929-80b456fea0bc", ratio: "3/2", label: "Stage & decor" },
        { src: "1532712938310-34cb3982ef74", ratio: "4/5", label: "Florals" },
        { src: "1469371670807-013ccf25f16a", ratio: "3/2", label: "Baraat, dusk" },
        { src: "1525258946800-98cfd641d0de", ratio: "3/4", label: "Dupatta detail" },
        { src: "1511795409834-ef04bbd61622", ratio: "3/2", label: "Celebration" },
      ],
      films: [
        { id: "1537633552985-df8429e8048b", title: "Ayesha & Bilal", events: "Mehndi · Baraat · Reception", len: "6:42", place: "London", poster: "1537633552985-df8429e8048b", videoSrc: "" },
        { id: "1606216794074-735e91aa2c92", title: "Tasnia & Rahul", events: "Holud · Ceremony · Reception", len: "5:18", place: "Birmingham", poster: "1606216794074-735e91aa2c92", videoSrc: "" },
        { id: "1469371670807-013ccf25f16a", title: "Sana & Imran", events: "Mehndi · Nikah · Walima", len: "7:05", place: "Manchester", poster: "1469371670807-013ccf25f16a", videoSrc: "" },
        { id: "1522673607200-164d1b6ce486", title: "Nadia & Arif", events: "Holud · Civil ceremony", len: "4:30", place: "London", poster: "1522673607200-164d1b6ce486", videoSrc: "" },
      ],
      blocked: [],
      discounts: [],
    },
    galleries: [],
    bookings: [],
    enquiries: [],
    sessions: {},
  };
}

let db;
try { db = JSON.parse(fs.readFileSync(DB_FILE, "utf8")); }
catch (e) { db = seedDb(); persist(); }
// backfill any missing keys after upgrades
db.site = db.site || seedDb().site;
db.galleries = db.galleries || [];
db.bookings = db.bookings || [];
db.enquiries = db.enquiries || [];
db.sessions = db.sessions || {};

let writeTimer = null;
function persist() {
  // atomic-ish write: tmp file + rename
  const tmp = DB_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(db));
  fs.renameSync(tmp, DB_FILE);
}
function persistSoon() {
  clearTimeout(writeTimer);
  writeTimer = setTimeout(() => { try { persist(); } catch (e) { console.error("persist failed", e); } }, 250);
}

const makeId = () => "g" + Date.now().toString(36) + crypto.randomBytes(3).toString("hex");

// ---------- data-URL extraction (uploads embedded in JSON payloads) ----------
const EXT_BY_MIME = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "video/mp4": "mp4", "video/webm": "webm", "video/quicktime": "mov", "application/pdf": "pdf" };
function saveDataUrl(dataUrl) {
  const m = /^data:([\w/.+-]+);base64,(.+)$/s.exec(dataUrl);
  if (!m) return dataUrl;
  const mime = m[1];
  const ext = EXT_BY_MIME[mime] || (mime.split("/")[1] || "bin").slice(0, 5);
  const name = crypto.randomBytes(10).toString("hex") + "." + ext;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), Buffer.from(m[2], "base64"));
  return "/u/" + name;
}
function extractDataUrls(node) {
  if (typeof node === "string") return node.startsWith("data:") && node.length > 200 ? saveDataUrl(node) : node;
  if (Array.isArray(node)) return node.map(extractDataUrls);
  if (node && typeof node === "object") {
    const out = {};
    for (const k of Object.keys(node)) out[k] = extractDataUrls(node[k]);
    return out;
  }
  return node;
}

// ---------- helpers ----------
const publicGallery = (g) => ({ id: g.id, couple: g.couple, date: g.date, venue: g.venue, cover: g.cover, count: (g.photos || []).length });
const publicSite = (s) => ({ hero: s.hero, photos: s.photos, films: s.films, blocked: s.blocked || [] });
function earliestBookable() {
  const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + MIN_LEAD_DAYS); return d;
}
function dateFromKey(k) {
  const [y, m, d] = String(k).split("-").map(Number);
  if (!y || m == null || !d) return null;
  return new Date(y, m, d);
}
function findDiscount(code) {
  return (db.site.discounts || []).find((d) => (d.code || "").trim().toLowerCase() === String(code || "").trim().toLowerCase()) || null;
}
const discountUsable = (c) => !!c && (!c.maxUses || (c.used || 0) < c.maxUses);
function discountAmount(price, c) {
  if (!c || !price) return 0;
  if (c.type === "percent") return Math.round(price * (c.value / 100));
  return Math.min(price, c.value);
}
function blockDate(k) { if (!k) return; const s = new Set(db.site.blocked || []); s.add(k); db.site.blocked = [...s]; }
function unblockDate(k) { if (!k) return; db.site.blocked = (db.site.blocked || []).filter((x) => x !== k); }
// A date is "held" while someone else has an unpaid, unexpired checkout in flight for it —
// prevents two customers from both reaching Stripe for the same date at once.
function dateIsHeld(k) {
  return db.bookings.some((b) => b.dateKey === k && b.status === "pending" && b.holdExpiresAt && b.holdExpiresAt > Date.now());
}
// Drop abandoned checkout attempts (hold long expired, never paid) so db.json doesn't grow forever.
function prunePendingBookings() {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const before = db.bookings.length;
  db.bookings = db.bookings.filter((b) => !(b.status === "pending" && b.holdExpiresAt && b.holdExpiresAt < cutoff));
  if (db.bookings.length !== before) persistSoon();
}
function receiptOf(b) {
  return {
    id: b.id, status: b.status, coupleA: b.coupleA, coupleB: b.coupleB, email: b.email, venue: b.venue,
    covName: b.covName, packageName: b.packageName, dateLabel: b.dateLabel,
    price: b.price, discountCode: b.discountCode, discountAmount: b.discountAmount, total: b.total,
    deposit: b.deposit, balance: b.balance, balanceDue: b.balanceDue, payMode: b.payMode,
  };
}

// ---------- rate limiting (per client IP, in-memory) ----------
const rateBuckets = new Map();
function rateLimited(key, max, windowMs) {
  const now = Date.now();
  const b = rateBuckets.get(key);
  if (!b || now > b.resetAt) { rateBuckets.set(key, { count: 1, resetAt: now + windowMs }); return false; }
  b.count += 1;
  return b.count > max;
}
function clientIp(req) {
  return req.headers["cf-connecting-ip"] || String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "unknown";
}

// ---------- auth ----------
function requireAdmin(req, res, next) {
  const tok = (req.headers.authorization || "").replace(/^Bearer /, "");
  const sess = db.sessions[tok];
  if (!tok || !sess || Date.now() - sess.ts > 1000 * 60 * 60 * 24 * 7) return res.status(401).json({ error: "unauthorized" });
  sess.ts = Date.now();
  next();
}

// ---------- app ----------
const app = express();
app.disable("x-powered-by");

// Stripe webhook needs the raw body — register BEFORE json parsing.
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), (req, res) => {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(500).send("stripe not configured");
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send("signature verification failed");
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const b = db.bookings.find((x) => x.id === session.metadata?.bookingId);
    if (b && b.status === "pending") {
      b.status = "confirmed";
      b.paymentIntent = session.payment_intent || "";
      b.amountPaid = (session.amount_total || 0) / 100;
      b.confirmedAt = Date.now();
      blockDate(b.dateKey);
      const disc = findDiscount(b.discountCode);
      if (disc) disc.used = (disc.used || 0) + 1;
      persistSoon();
    }
  }
  res.json({ received: true });
});

app.use(express.json({ limit: "40mb" }));

// ---------- public API ----------
app.get("/api/public", (req, res) => {
  res.json({ site: publicSite(db.site), galleries: db.galleries.map(publicGallery) });
});

app.post("/api/galleries/unlock", (req, res) => {
  if (rateLimited("gallery:" + clientIp(req), 20, 15 * 60 * 1000)) return res.status(429).json({ error: "Too many attempts — try again in 15 minutes." });
  const { id, password } = req.body || {};
  const g = db.galleries.find((x) => x.id === id);
  if (!g || (g.password || "").trim().toLowerCase() !== String(password || "").trim().toLowerCase() || !String(password || "").trim())
    return res.status(403).json({ error: "wrong password" });
  const { password: _, ...rest } = g;
  res.json({ gallery: { ...rest, comments: g.comments || [] } });
});

app.post("/api/galleries/:id/comments", (req, res) => {
  const { password, name, text } = req.body || {};
  const g = db.galleries.find((x) => x.id === req.params.id);
  if (!g || (g.password || "").trim().toLowerCase() !== String(password || "").trim().toLowerCase())
    return res.status(403).json({ error: "wrong password" });
  if (!String(name || "").trim() || !String(text || "").trim()) return res.status(400).json({ error: "name and text required" });
  const c = { name: String(name).slice(0, 80), text: String(text).slice(0, 1000), photo: Number(req.body.photo) || 0, when: new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), createdAt: Date.now() };
  g.comments = g.comments || [];
  g.comments.push(c);
  persistSoon();
  res.json({ comment: c, comments: g.comments });
});

app.post("/api/discounts/validate", (req, res) => {
  const c = findDiscount((req.body || {}).code);
  if (!c) return res.status(404).json({ error: "invalid" });
  if (!discountUsable(c)) return res.status(410).json({ error: "exhausted" });
  res.json({ code: c.code, type: c.type, value: c.value });
});

app.post("/api/enquiries", (req, res) => {
  const { name, email, message, type } = req.body || {};
  if (!String(name || "").trim() || !/\S+@\S+\.\S+/.test(String(email || ""))) return res.status(400).json({ error: "name and valid email required" });
  const rec = { id: makeId(), createdAt: Date.now(), type: type === "quote" ? "quote" : "message", name: String(name).slice(0, 120), email: String(email).slice(0, 200), message: String(message || "").slice(0, 5000) };
  db.enquiries.unshift(rec);
  persistSoon();
  res.json({ ok: true });
});

// ---------- checkout ----------
app.post("/api/checkout", async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ error: "Payments are not configured yet." });
    const { coverage, pkgId, dateKey, dateLabel, form, payMode, discountCode } = req.body || {};
    const pkg = (PACKAGES[coverage] || {})[pkgId];
    if (!pkg || pkg.price == null) return res.status(400).json({ error: "Invalid package." });
    const f = form || {};
    if (!String(f.a || "").trim() || !/\S+@\S+\.\S+/.test(String(f.email || ""))) return res.status(400).json({ error: "Name and a valid email are required." });
    const date = dateFromKey(dateKey);
    if (!date) return res.status(400).json({ error: "Pick a date." });
    if (date < earliestBookable()) return res.status(400).json({ error: "Bookings need at least " + MIN_LEAD_DAYS + " days' notice." });
    prunePendingBookings();
    if ((db.site.blocked || []).includes(dateKey) || dateIsHeld(dateKey)) return res.status(409).json({ error: "Sorry — that date has just been taken." });

    const disc = findDiscount(discountCode);
    const discOk = disc && discountUsable(disc);
    const discAmt = discOk ? discountAmount(pkg.price, disc) : 0;
    const total = pkg.price - discAmt;
    const deposit = Math.round(total * 0.25);
    const mode = payMode === "full" ? "full" : "deposit";
    const payToday = mode === "full" ? total : deposit;

    const due = new Date(date); due.setDate(due.getDate() - 14);
    const balanceDue = mode === "full" ? "—" : due.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

    const booking = {
      id: makeId(), createdAt: Date.now(), status: "pending",
      holdExpiresAt: Date.now() + HOLD_MINUTES * 60 * 1000,
      coupleA: f.a, coupleB: f.b, email: f.email, phone: f.phone, venue: f.venue, guests: f.guests, functions: f.functions,
      coverage, covName: COVERAGE_NAMES[coverage] || coverage, packageName: pkg.name,
      dateKey, dateLabel,
      price: pkg.price, discountCode: discOk ? disc.code : "", discountAmount: discAmt, total,
      deposit: payToday, balance: mode === "full" ? 0 : total - deposit, balanceDue, payMode: mode,
      notes: "", assets: [],
    };
    db.bookings.unshift(booking);
    persistSoon();

    const label = pkg.name + " — " + booking.covName + (mode === "full" ? " (paid in full)" : " (25% deposit)") + " · " + dateLabel;
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: f.email,
      line_items: [{ quantity: 1, price_data: { currency: "gbp", unit_amount: payToday * 100, product_data: { name: label } } }],
      metadata: { bookingId: booking.id },
      success_url: PUBLIC_URL + "/?booking=" + booking.id + "&paid=1",
      cancel_url: PUBLIC_URL + "/?canceled=1",
      // Stripe's own checkout page always dies before our hold does (see HOLD_MINUTES
      // above), so a customer can never still be paying after we've freed the date.
      expires_at: Math.floor(Date.now() / 1000) + STRIPE_SESSION_MINUTES * 60,
    });
    booking.checkoutSession = session.id;
    persistSoon();
    res.json({ url: session.url });
  } catch (e) {
    console.error("checkout failed", e);
    res.status(500).json({ error: "Could not start checkout. Try again." });
  }
});

app.get("/api/bookings/:id/receipt", (req, res) => {
  const b = db.bookings.find((x) => x.id === req.params.id);
  if (!b) return res.status(404).json({ error: "not found" });
  res.json({ booking: receiptOf(b) });
});

// ---------- admin API ----------
app.post("/api/admin/login", (req, res) => {
  if (!ADMIN_PASSWORD) return res.status(500).json({ error: "ADMIN_PASSWORD not set on the server." });
  if (rateLimited("admin:" + clientIp(req), 8, 15 * 60 * 1000)) return res.status(429).json({ error: "Too many attempts — try again in 15 minutes." });
  const given = String((req.body || {}).password || "");
  const a = Buffer.from(given), b = Buffer.from(ADMIN_PASSWORD);
  const ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  if (!ok) return res.status(403).json({ error: "wrong password" });
  const token = crypto.randomBytes(24).toString("hex");
  // prune old sessions
  for (const t of Object.keys(db.sessions)) if (Date.now() - db.sessions[t].ts > 1000 * 60 * 60 * 24 * 7) delete db.sessions[t];
  db.sessions[token] = { ts: Date.now() };
  persistSoon();
  res.json({ token });
});

app.get("/api/admin/all", requireAdmin, (req, res) => {
  res.json({ site: db.site, galleries: db.galleries, bookings: db.bookings, enquiries: db.enquiries });
});

app.put("/api/admin/site", requireAdmin, (req, res) => {
  const s = extractDataUrls((req.body || {}).site || {});
  db.site = {
    hero: s.hero || db.site.hero,
    photos: Array.isArray(s.photos) ? s.photos : db.site.photos,
    films: Array.isArray(s.films) ? s.films : db.site.films,
    blocked: Array.isArray(s.blocked) ? s.blocked : db.site.blocked,
    discounts: Array.isArray(s.discounts) ? s.discounts : db.site.discounts,
  };
  persistSoon();
  res.json({ site: db.site });
});

app.put("/api/admin/galleries", requireAdmin, (req, res) => {
  const list = (req.body || {}).galleries;
  if (!Array.isArray(list)) return res.status(400).json({ error: "galleries array required" });
  // preserve comments on existing galleries (admin UI doesn't edit them)
  const byId = Object.fromEntries(db.galleries.map((g) => [g.id, g]));
  db.galleries = extractDataUrls(list).map((g) => ({ ...g, comments: (byId[g.id] || {}).comments || g.comments || [] }));
  persistSoon();
  res.json({ galleries: db.galleries });
});

app.post("/api/admin/bookings", requireAdmin, (req, res) => {
  const b = extractDataUrls((req.body || {}).booking || {});
  b.id = b.id || makeId();
  b.createdAt = b.createdAt || Date.now();
  b.status = "confirmed";
  b.manual = true;
  db.bookings.unshift(b);
  blockDate(b.dateKey);
  persistSoon();
  res.json({ booking: b });
});

app.put("/api/admin/bookings/:id", requireAdmin, (req, res) => {
  const b = db.bookings.find((x) => x.id === req.params.id);
  if (!b) return res.status(404).json({ error: "not found" });
  const patch = extractDataUrls((req.body || {}).patch || {});
  const allowed = ["coupleA", "coupleB", "email", "phone", "venue", "guests", "functions", "notes", "assets"];
  for (const k of allowed) if (k in patch) b[k] = patch[k];
  persistSoon();
  res.json({ booking: b });
});

app.post("/api/admin/bookings/:id/refund", requireAdmin, async (req, res) => {
  const b = db.bookings.find((x) => x.id === req.params.id);
  if (!b) return res.status(404).json({ error: "not found" });
  try {
    if (b.paymentIntent && stripe) await stripe.refunds.create({ payment_intent: b.paymentIntent });
    b.status = "refunded";
    b.refundedAt = Date.now();
    unblockDate(b.dateKey);
    persistSoon();
    res.json({ booking: b, stripeRefund: !!(b.paymentIntent && stripe) });
  } catch (e) {
    console.error("refund failed", e);
    res.status(500).json({ error: "Stripe refund failed: " + (e.message || "unknown error") });
  }
});

app.delete("/api/admin/enquiries/:id", requireAdmin, (req, res) => {
  db.enquiries = db.enquiries.filter((x) => x.id !== req.params.id);
  persistSoon();
  res.json({ ok: true });
});

// ---------- static ----------
app.use("/u", express.static(UPLOAD_DIR, { maxAge: "30d", immutable: true }));
app.use(express.static(SITE_DIR, { maxAge: "1h" }));
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "not found" });
  res.sendFile(path.join(SITE_DIR, "index.html"));
});

process.on("SIGTERM", () => { try { persist(); } catch (e) {} process.exit(0); });
process.on("SIGINT", () => { try { persist(); } catch (e) {} process.exit(0); });

app.listen(PORT, () => {
  console.log(`yusufshoots site running on :${PORT}`);
  console.log(`  data:   ${DATA_DIR}`);
  console.log(`  site:   ${SITE_DIR}`);
  console.log(`  stripe: ${stripe ? "configured" : "NOT CONFIGURED — payments disabled"}`);
  console.log(`  admin:  ${ADMIN_PASSWORD ? "password set" : "NO ADMIN_PASSWORD — Studio login disabled"}`);
});
