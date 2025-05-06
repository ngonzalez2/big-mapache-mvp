const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const db = new sqlite3.Database('data.db');

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client TEXT,
    amount REAL,
    issued_at TEXT
  )`);
});

app.get('/api/invoices', (req, res) => {
  db.all('SELECT * FROM invoices', (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/invoices', (req, res) => {
  const { client, amount } = req.body;
  const issued_at = new Date().toISOString();
  db.run(
    'INSERT INTO invoices (client, amount, issued_at) VALUES (?, ?, ?)',
    [client, amount, issued_at],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT * FROM invoices WHERE id = ?', [this.lastID], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json(row);
      });
    }
  );
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
