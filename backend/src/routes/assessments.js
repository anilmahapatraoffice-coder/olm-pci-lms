const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// ─── ADMIN routes MUST come before /:id to avoid Express matching 'admin' as an ID ───

// ─── GET assessment + questions + user attempt history ───────────────────────
router.get('/:id', authMiddleware, async (req, res) => {
  if (req.params.id === 'admin') return res.status(400).json({ message: 'Invalid assessment ID' });
  try {
    const [assessments] = await pool.query('SELECT * FROM assessments WHERE id = ?', [req.params.id]);
    if (!assessments.length) return res.status(404).json({ message: 'Assessment not found' });
    const assessment = assessments[0];

    const [questions] = await pool.query(
      'SELECT id, question_text, options, order_index FROM questions WHERE assessment_id = ? ORDER BY order_index',
      [req.params.id]
    );

    // All attempts by this user for this assessment
    const [submissions] = await pool.query(
      'SELECT id, score, attempt_number, submitted_at FROM assessment_submissions WHERE user_id = ? AND assessment_id = ? ORDER BY attempt_number',
      [req.user.id, req.params.id]
    );

    // Latest approved reassessment request (gives +1 extra attempt)
    const [reqs] = await pool.query(
      `SELECT * FROM reassessment_requests WHERE user_id = ? AND assessment_id = ? ORDER BY requested_at DESC LIMIT 1`,
      [req.user.id, req.params.id]
    );
    const latestRequest = reqs[0] || null;

    const attemptsUsed = submissions.length;
    const approvedExtras = await pool.query(
      `SELECT COUNT(*) AS cnt FROM reassessment_requests WHERE user_id = ? AND assessment_id = ? AND status = 'approved'`,
      [req.user.id, req.params.id]
    );
    const extraAttempts = approvedExtras[0][0].cnt;
    const totalAllowed = assessment.max_attempts + Number(extraAttempts);
    const attemptsLeft = totalAllowed - attemptsUsed;
    const bestScore = submissions.length ? Math.max(...submissions.map(s => s.score)) : null;
    const passed = bestScore !== null && bestScore >= assessment.pass_score;

    res.json({
      ...assessment,
      questions,
      submissions,
      attemptsUsed,
      attemptsLeft,
      totalAllowed,
      passed,
      bestScore,
      latestRequest
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── SUBMIT assessment ────────────────────────────────────────────────────────
router.post('/:id/submit', authMiddleware, async (req, res) => {
  try {
    const { answers } = req.body;
    const [assessments] = await pool.query('SELECT * FROM assessments WHERE id = ?', [req.params.id]);
    if (!assessments.length) return res.status(404).json({ message: 'Not found' });
    const assessment = assessments[0];

    // Check attempts
    const [[{ attemptsUsed }]] = await pool.query(
      'SELECT COUNT(*) AS "attemptsUsed" FROM assessment_submissions WHERE user_id = ? AND assessment_id = ?',
      [req.user.id, req.params.id]
    );
    const [[{ extraAttempts }]] = await pool.query(
      `SELECT COUNT(*) AS "extraAttempts" FROM reassessment_requests WHERE user_id = ? AND assessment_id = ? AND status = 'approved'`,
      [req.user.id, req.params.id]
    );
    const totalAllowed = assessment.max_attempts + Number(extraAttempts);

    if (Number(attemptsUsed) >= totalAllowed) {
      return res.status(400).json({ message: 'No attempts remaining. Request reassessment.' });
    }

    const [questions] = await pool.query('SELECT * FROM questions WHERE assessment_id = ?', [req.params.id]);
    let correct = 0;
    questions.forEach((q, i) => { if (answers[i] !== undefined && answers[i] === q.correct_answer) correct++; });
    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= assessment.pass_score;
    const attemptNumber = Number(attemptsUsed) + 1;

    await pool.query(
      'INSERT INTO assessment_submissions (id, user_id, assessment_id, score, answers, attempt_number) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), req.user.id, req.params.id, score, JSON.stringify(answers), attemptNumber]
    );

    const attemptsLeft = totalAllowed - attemptNumber;
    res.json({ score, passed, correct, total: questions.length, attemptNumber, attemptsLeft, passScore: assessment.pass_score });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── REQUEST reassessment (when all auto-attempts exhausted) ──────────────────
router.post('/:id/request-reassessment', authMiddleware, async (req, res) => {
  try {
    const { reason } = req.body;

    // Check already has pending request
    const [existing] = await pool.query(
      `SELECT id FROM reassessment_requests WHERE user_id = ? AND assessment_id = ? AND status = 'pending'`,
      [req.user.id, req.params.id]
    );
    if (existing.length) return res.status(409).json({ message: 'You already have a pending reassessment request.' });

    await pool.query(
      'INSERT INTO reassessment_requests (id, user_id, assessment_id, reason) VALUES (?, ?, ?, ?)',
      [uuidv4(), req.user.id, req.params.id, reason || '']
    );
    res.json({ message: 'Reassessment request submitted. Please wait for admin approval.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── ADMIN: Get all reassessment requests ─────────────────────────────────────
router.get('/admin/requests', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status } = req.query;
    let where = '1=1';
    const params = [];
    if (status) { where += ' AND r.status = ?'; params.push(status); }

    const [rows] = await pool.query(
      `SELECT r.*, u.name AS user_name, u.mobile, u.district, u.block, u.designation,
              a.title AS assessment_title, a.type AS assessment_type,
              c.title AS course_title,
              (SELECT MAX(sub.score) FROM assessment_submissions sub WHERE sub.user_id = r.user_id AND sub.assessment_id = r.assessment_id) AS best_score,
              (SELECT COUNT(*) FROM assessment_submissions sub WHERE sub.user_id = r.user_id AND sub.assessment_id = r.assessment_id) AS attempts_used
       FROM reassessment_requests r
       JOIN users u ON r.user_id = u.id
       JOIN assessments a ON r.assessment_id = a.id
       LEFT JOIN sections s ON a.section_id = s.id
       LEFT JOIN courses c ON s.course_id = c.id
       WHERE ${where}
       ORDER BY r.requested_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── ADMIN: Approve / Reject reassessment request ─────────────────────────────
router.patch('/admin/requests/:requestId', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { status, admin_note } = req.body; // 'approved' | 'rejected'
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    await pool.query(
      `UPDATE reassessment_requests SET status = ?, admin_note = ?, reviewed_at = NOW() WHERE id = ?`,
      [status, admin_note || '', req.params.requestId]
    );
    res.json({ message: `Request ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── ADMIN: Add assessment ─────────────────────────────────────────────────────
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { section_id, type, title, pass_score, max_attempts } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO assessments (id, section_id, type, title, pass_score, max_attempts) VALUES (?, ?, ?, ?, ?, ?)',
      [id, section_id, type, title, pass_score || 60, max_attempts || 3]
    );
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── ADMIN: Add question ───────────────────────────────────────────────────────
router.post('/questions', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { assessment_id, question_text, options, correct_answer, order_index } = req.body;
    const id = uuidv4();
    await pool.query(
      'INSERT INTO questions (id, assessment_id, question_text, options, correct_answer, order_index) VALUES (?, ?, ?, ?, ?, ?)',
      [id, assessment_id, question_text, JSON.stringify(options), correct_answer, order_index || 0]
    );
    res.status(201).json({ id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
