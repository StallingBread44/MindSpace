require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// PostgreSQL pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});

// Test DB connection
pool.query('SELECT NOW()')
  .then(res => console.log('Postgres connected:', res.rows))
  .catch(err => console.error('DB Error:', err));

// Middleware to authenticate JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
}

// ---------------- SIGNUP ----------------
app.post('/api/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password)
      return res.status(400).json({ message: 'Missing fields' });

    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash)
       VALUES ($1, $2, $3) RETURNING id, username`,
      [username, email, hashed]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ id: user.id, username: user.username, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating user' });
  }
});

// ---------------- LOGIN ----------------
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    const user = result.rows[0];

    if (!user) return res.status(400).json({ message: 'User not found' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Incorrect password' });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ id: user.id, username: user.username, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login error' });
  }
});

// ---------------- CATEGORIES ----------------
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// ---------------- THREADS ----------------
app.get('/api/threads', async (req, res) => {
  try {
    const { category } = req.query;
    const result = await pool.query(
      `SELECT t.id, t.title, u.username
       FROM threads t
       JOIN users u ON t.author_id = u.id
       WHERE t.category_id = $1
       ORDER BY t.id DESC`,
      [category]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching threads' });
  }
});

app.get('/api/threads/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const threadResult = await pool.query(
      `SELECT t.id, t.title, u.username
       FROM threads t
       JOIN users u ON t.author_id = u.id
       WHERE t.id = $1`,
      [id]
    );

    const repliesResult = await pool.query(
      `SELECT r.id, r.content, u.username
       FROM replies r
       JOIN users u ON r.author_id = u.id
       WHERE r.thread_id = $1
       ORDER BY r.id`,
      [id]
    );

    res.json({ thread: threadResult.rows[0], replies: repliesResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching thread' });
  }
});

// ---------------- CREATE THREAD ----------------
app.post('/api/threads', authenticateToken, async (req, res) => {
  try {
    const { title, content, categoryId } = req.body;
    const userId = req.user.id;

    const threadResult = await pool.query(
      `INSERT INTO threads (title, content, category_id, author_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [title, content, categoryId, userId]
    );

    res.json({ id: threadResult.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating thread' });
  }
});

// ---------------- REPLY ----------------
app.post('/api/threads/reply', authenticateToken, async (req, res) => {
  try {
    const { threadId, content } = req.body;
    const userId = req.user.id;

    await pool.query(
      `INSERT INTO replies (thread_id, content, author_id)
       VALUES ($1, $2, $3)`,
      [threadId, content, userId]
    );

    res.json({ message: 'Reply added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error posting reply' });
  }
});

app.get("/api/blogs", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.id,
        b.title,
        b.created_at,
        u.username
      FROM blog_posts b
      JOIN users u ON b.author_id = u.id
      ORDER BY b.created_at DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch blogs" });
  }
});

app.get("/api/blogs/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        b.id,
        b.title,
        b.content,
        b.created_at,
        u.username
      FROM blog_posts b
      JOIN users u ON b.author_id = u.id
      WHERE b.id = $1
    `, [id]);

    if (!result.rows.length) {
      return res.status(404).json({ message: "Blog post not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch blog post" });
  }
});

app.post("/api/blogs", authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: "Missing title or content" });
    }

    const result = await pool.query(`
      INSERT INTO blog_posts (title, content, author_id)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [title, content, req.user.id]);

    res.status(201).json({
      message: "Blog post created",
      id: result.rows[0].id
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create blog post" });
  }
});


// ---------------- SERVER START ----------------
app.listen(port, () => {
  console.log(`Forum backend running on port ${port}`);
});
