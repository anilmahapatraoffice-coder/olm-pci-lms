const router = require('express').Router();
const pool = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Learner course tracking report
router.get('/learner-tracking', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { district, block, gp, course_id, page = 1, limit = 25 } = req.query;
    let where = ['1=1'];
    const params = [];

    if (district) { where.push('u.district = ?'); params.push(district); }
    if (block) { where.push('u.block = ?'); params.push(block); }
    if (gp) { where.push('u.gp = ?'); params.push(gp); }
    if (course_id) { where.push('c.id = ?'); params.push(course_id); }

    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT u.name, u.mobile, u.district, u.block, u.gp, u.designation,
              c.title AS course_name, e.enrolled_at,
              COUNT(DISTINCT ch.id) AS total_chapters,
              COUNT(DISTINCT p.chapter_id) AS completed_chapters,
              ROUND(COUNT(DISTINCT p.chapter_id) * 100.0 / NULLIF(COUNT(DISTINCT ch.id), 0), 1) AS progress_pct
       FROM enrollments e
       JOIN users u ON e.user_id = u.id
       JOIN courses c ON e.course_id = c.id
       LEFT JOIN sections s ON s.course_id = c.id
       LEFT JOIN chapters ch ON ch.section_id = s.id
       LEFT JOIN progress p ON p.chapter_id = ch.id AND p.user_id = u.id
       WHERE ${where.join(' AND ')}
       GROUP BY u.id, c.id, e.enrolled_at
       ORDER BY u.name
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Assessment submission report
router.get('/assessments', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { district, block, gp } = req.query;
    let where = ['1=1'];
    const params = [];

    if (district) { where.push('u.district = ?'); params.push(district); }
    if (block) { where.push('u.block = ?'); params.push(block); }
    if (gp) { where.push('u.gp = ?'); params.push(gp); }

    const [rows] = await pool.query(
      `SELECT u.name, u.mobile, u.district, u.block, u.gp,
              a.title AS assessment_title, a.type, a.pass_score,
              sub.score, sub.attempt_number, sub.submitted_at,
              IF(sub.score >= a.pass_score, 'Pass', 'Fail') AS result
       FROM assessment_submissions sub
       JOIN users u ON sub.user_id = u.id
       JOIN assessments a ON sub.assessment_id = a.id
       WHERE ${where.join(' AND ')}
       ORDER BY sub.submitted_at DESC
       LIMIT 500`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
