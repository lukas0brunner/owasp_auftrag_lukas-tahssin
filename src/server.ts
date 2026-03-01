import express from "express";
import path from "path";
import sqlite3 from "sqlite3";

const app = express();
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const MODE = (process.env.MODE || "vuln").toLowerCase();
const DEFAULT_SUBTOTAL = 20;
const COUPON_CODE = "TENOFF";
const COUPON_DISCOUNT = 10;

const dbFile = path.resolve(__dirname, "..", "data.sqlite");
const db = new sqlite3.Database(dbFile);

function run(
  sql: string,
  params: Array<string | number> = []
): Promise<{ changes: number; lastID: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(this: sqlite3.RunResult, err: Error | null) {
      if (err) return reject(err);
      resolve({ changes: this.changes ?? 0, lastID: this.lastID ?? 0 });
    });
  });
}

function get<T>(
  sql: string,
  params: Array<string | number> = []
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err: Error | null, row: unknown) => {
      if (err) return reject(err);
      resolve(row as T | undefined);
    });
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function initDb(): Promise<void> {
  await run(
    "CREATE TABLE IF NOT EXISTS coupons (code TEXT PRIMARY KEY, valid INTEGER)"
  );
  await run(
    "CREATE TABLE IF NOT EXISTS cart (userId TEXT PRIMARY KEY, subtotal INTEGER, discount INTEGER)"
  );

  await run(
    "INSERT OR REPLACE INTO coupons (code, valid) VALUES (?, 1)",
    [COUPON_CODE]
  );
  await run(
    "INSERT OR REPLACE INTO cart (userId, subtotal, discount) VALUES (?, ?, 0)",
    ["u1", DEFAULT_SUBTOTAL]
  );
}

async function ensureCart(userId: string): Promise<void> {
  const cart = await get<{ userId: string }>(
    "SELECT userId FROM cart WHERE userId = ?",
    [userId]
  );
  if (!cart) {
    await run(
      "INSERT INTO cart (userId, subtotal, discount) VALUES (?, ?, 0)",
      [userId, DEFAULT_SUBTOTAL]
    );
  }
}

async function getCartResponse(userId: string): Promise<{
  subtotal: number;
  discount: number;
  total: number;
  appliedCoupons: string[];
}> {
  const cart = await get<{ subtotal: number; discount: number }>(
    "SELECT subtotal, discount FROM cart WHERE userId = ?",
    [userId]
  );
  if (!cart) {
    return {
      subtotal: DEFAULT_SUBTOTAL,
      discount: 0,
      total: DEFAULT_SUBTOTAL,
      appliedCoupons: [],
    };
  }
  const total = Math.max(0, cart.subtotal - cart.discount);
  const appliedCoupons = cart.discount > 0 ? [COUPON_CODE] : [];
  return {
    subtotal: cart.subtotal,
    discount: cart.discount,
    total,
    appliedCoupons,
  };
}

app.get("/cart", async (req, res) => {
  const userId = (req.query.userId as string) || "u1";
  try {
    await ensureCart(userId);
    const cart = await getCartResponse(userId);
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: "Failed to load cart" });
  }
});

app.post("/apply-coupon", async (req, res) => {
  const { userId, code } = req.body || {};

  if (!userId || !code) {
    return res.status(400).json({ error: "userId and code required" });
  }
  if (code !== COUPON_CODE) {
    return res.status(400).json({ error: "Unknown coupon" });
  }

  try {
    await ensureCart(userId);

    if (MODE === "fixed") {
      const result = await run(
        "UPDATE coupons SET valid = 0 WHERE code = ? AND valid = 1",
        [code]
      );
      if (result.changes !== 1) {
        return res.status(409).json({ error: "Coupon already used" });
      }
      await run(
        "UPDATE cart SET discount = discount + ? WHERE userId = ?",
        [COUPON_DISCOUNT, userId]
      );
      const cart = await getCartResponse(userId);
      return res.json(cart);
    }

    const coupon = await get<{ valid: number }>(
      "SELECT valid FROM coupons WHERE code = ?",
      [code]
    );
    if (!coupon || coupon.valid !== 1) {
      return res.status(409).json({ error: "Coupon already used" });
    }

    await delay(150);

    await run("UPDATE coupons SET valid = 0 WHERE code = ?", [code]);
    await run(
      "UPDATE cart SET discount = discount + ? WHERE userId = ?",
      [COUPON_DISCOUNT, userId]
    );

    const cart = await getCartResponse(userId);
    return res.json(cart);
  } catch (err) {
    return res.status(500).json({ error: "Failed to apply coupon" });
  }
});

app.post("/reset", async (_req, res) => {
  try {
    await run("INSERT OR REPLACE INTO coupons (code, valid) VALUES (?, 1)", [
      COUPON_CODE,
    ]);
    await run(
      "INSERT OR REPLACE INTO cart (userId, subtotal, discount) VALUES (?, ?, 0)",
      ["u1", DEFAULT_SUBTOTAL]
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to reset" });
  }
});

const publicDir = path.resolve(__dirname, "..", "public");
app.use(express.static(publicDir));

initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT} (mode=${MODE})`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database", err);
    process.exit(1);
  });
