const path = require("path");
const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const db = new sqlite3.Database(":memory:");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ----------------------
// DATABASE SETUP
// ----------------------
db.serialize(() => {
    db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL
    )
  `);

    db.run(`
    INSERT INTO users (username, password, role) VALUES
      ('alice', 'alice123', 'user'),
      ('bob', 'bob123', 'admin'),
      ('charlie', 'charlie123', 'user')
  `);
});

// ----------------------
// ❌ VULNERABLE LOGIN
// ----------------------
app.post("/api/login", (req, res) => {
    const { username = "", password = "" } = req.body;

    const sql =
        "SELECT id, username, role FROM users WHERE username = '" +
        username +
        "' AND password = '" +
        password +
        "'";

    db.get(sql, (err, row) => {
        if (err) {
            return res.status(400).json({ error: err.message, sql });
        }

        if (!row) {
            return res.status(401).json({ ok: false, message: "Login failed", sql });
        }

        res.json({ ok: true, message: "Login success", user: row, sql });
    });

    /*
    // ✅ FIX (SAFE VERSION)

    const sqlSafe =
      "SELECT id, username, role FROM users WHERE username = ? AND password = ?";

    db.get(sqlSafe, [username, password], (err, row) => {
      if (err) return res.status(400).json({ error: err.message });

      if (!row) return res.status(401).json({ ok: false, message: "Login failed" });

      res.json({ ok: true, message: "Login success", user: row });
    });
    */
});

// ----------------------
// ❌ VULNERABLE SEARCH
// ----------------------
app.get("/api/search", (req, res) => {
    const q = req.query.q || "";

    const sql =
        "SELECT id, username, role FROM users WHERE username LIKE '%" +
        q +
        "%'";

    db.all(sql, (err, rows) => {
        if (err) {
            return res.status(400).json({ error: err.message, sql });
        }

        res.json({ resultCount: rows.length, rows, sql });
    });

    /*
    // ✅ FIX (SAFE VERSION)

    const sqlSafe =
      "SELECT id, username, role FROM users WHERE username LIKE ?";
    const param = "%" + q + "%";

    db.all(sqlSafe, [param], (err, rows) => {
      if (err) return res.status(400).json({ error: err.message });
      res.json({ resultCount: rows.length, rows });
    });
    */
});

app.listen(3000, () => {
    console.log("Running at http://localhost:3000");
});