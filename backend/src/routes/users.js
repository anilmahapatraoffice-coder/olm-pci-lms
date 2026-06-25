const router = require('express').Router();
const pool = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT id, mobile, name, designation, district, block, gp, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile
router.put('/me', authMiddleware, async (req, res) => {
  try {
    const { name, designation, district, block, gp } = req.body;
    await pool.query(
      'UPDATE users SET name=?, designation=?, district=?, block=?, gp=? WHERE id=?',
      [name, designation, district, block, gp, req.user.id]
    );
    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's enrolled courses with progress
router.get('/me/courses', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT c.*, e.enrolled_at, e.completed_at,
        COUNT(DISTINCT ch.id) AS total_chapters,
        COUNT(DISTINCT p.chapter_id) AS completed_chapters
       FROM enrollments e
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN sections s ON s.course_id = c.id
       LEFT JOIN chapters ch ON ch.section_id = s.id
       LEFT JOIN progress p ON p.chapter_id = ch.id AND p.user_id = e.user_id
       WHERE e.user_id = ?
       GROUP BY c.id, e.enrolled_at, e.completed_at`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Get all users
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { district, block, gp, search, page = 1, limit = 25 } = req.query;
    let where = ['role = "learner"'];
    const params = [];

    if (district) { where.push('district = ?'); params.push(district); }
    if (block) { where.push('block = ?'); params.push(block); }
    if (gp) { where.push('gp = ?'); params.push(gp); }
    if (search) { where.push('(name LIKE ? OR mobile LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }

    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT id, mobile, name, designation, district, block, gp, created_at FROM users WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM users WHERE ${where.join(' AND ')}`,
      params
    );
    res.json({ users: rows, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
