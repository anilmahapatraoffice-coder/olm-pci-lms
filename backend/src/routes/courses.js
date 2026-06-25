const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// Get all active courses (public)
router.get('/', async (req, res) => {
  try {
    const [courses] = await pool.query('SELECT * FROM courses WHERE is_active = TRUE ORDER BY created_at DESC');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single course with sections and chapters
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [courses] = await pool.query('SELECT * FROM courses WHERE id = ?', [req.params.id]);
    if (!courses.length) return res.status(404).json({ message: 'Course not found' });

    const [sections] = await pool.query(
      'SELECT * FROM sections WHERE course_id = ? ORDER BY order_index',
      [req.params.id]
    );

    for (const section of sections) {
      const [chapters] = await pool.query(
        'SELECT * FROM chapters WHERE section_id = ? ORDER BY order_index',
        [section.id]
      );
      const [assessments] = await pool.query(
        'SELECT id, type, title, pass_score, max_attempts FROM assessments WHERE section_id = ?',
        [section.id]
      );
      section.chapters = chapters;
      section.assessments = assessments;
    }

    // Get user progress for this course
    const [progressRows] = await pool.query(
      `SELECT p.chapter_id FROM progress p
       JOIN chapters c ON p.chapter_id = c.id
       JOIN sections s ON c.section_id = s.id
       WHERE p.user_id = ? AND s.course_id = ?`,
      [req.user.id, req.params.id]
    );
    const completedChapters = progressRows.map(r => r.chapter_id);

    res.json({ ...courses[0], sections, completedChapters });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Enroll in course
router.post('/:id/enroll', authMiddleware, async (req, res) => {
  try {
    const id = uuidv4();
    await pool.query(
      'INSERT IGNORE INTO enrollments (id, user_id, course_id) VALUES (?, ?, ?)',
      [id, req.user.id, req.params.id]
    );
    res.json({ message: 'Enrolled successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Mark chapter as complete
router.post('/progress/:chapterId', authMiddleware, async (req, res) => {
  try {
    const id = uuidv4();
    await pool.query(
      'INSERT IGNORE INTO progress (id, user_id, chapter_id) VALUES (?, ?, ?)',
      [id, req.user.id, req.params.chapterId]
    );
    res.json({ message: 'Progress saved' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin: Add course
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { title, description, thumbnail, total_duration } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO courses (id, title, description, thumbnail, total_duration) VALUES (?, ?, ?, ?, ?)',
      [id, title, description, thumbnail, total_duration]
    );
    res.status(201).json({ id, title, description, thumbnail, total_duration });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
