const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const pool = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

// ─── Check eligibility for self-certification ─────────────────────────────
router.get('/eligibility/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Total chapters in course
    const [[{ totalChapters }]] = await pool.query(
      `SELECT COUNT(ch.id) AS "totalChapters"
       FROM chapters ch JOIN sections s ON ch.section_id = s.id
       WHERE s.course_id = ?`, [courseId]
    );

    // Completed chapters by user
    const [[{ completedChapters }]] = await pool.query(
      `SELECT COUNT(p.id) AS "completedChapters"
       FROM progress p
       JOIN chapters ch ON p.chapter_id = ch.id
       JOIN sections s ON ch.section_id = s.id
       WHERE p.user_id = ? AND s.course_id = ?`, [userId, courseId]
    );

    // Passed all post assessments
    const [postAssessments] = await pool.query(
      `SELECT a.id, a.pass_score FROM assessments a
       JOIN sections s ON a.section_id = s.id
       WHERE s.course_id = ? AND a.type = 'post'`, [courseId]
    );

    let allPostPassed = true;
    for (const assess of postAssessments) {
      const [[{ maxScore }]] = await pool.query(
        `SELECT COALESCE(MAX(score), 0) AS "maxScore" FROM assessment_submissions
         WHERE user_id = ? AND assessment_id = ?`, [userId, assess.id]
      );
      if (Number(maxScore) < assess.pass_score) { allPostPassed = false; break; }
    }

    // Already self-certified?
    const [certRows] = await pool.query(
      'SELECT * FROM self_certifications WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    // Already has certificate?
    const [certIssued] = await pool.query(
      'SELECT * FROM certificates WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    const progressPct = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;
    const courseCompleted = progressPct === 100;

    res.json({
      totalChapters,
      completedChapters,
      progressPct,
      courseCompleted,
      allPostPassed,
      selfCertified: certRows.length > 0,
      selfCertifiedAt: certRows[0]?.certified_at || null,
      certificateIssued: certIssued.length > 0,
      certificateNumber: certIssued[0]?.certificate_number || null,
      certificateIssuedAt: certIssued[0]?.issued_at || null,
      canSelfCertify: courseCompleted && allPostPassed && certRows.length === 0,
      canDownloadCertificate: certIssued.length > 0
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Submit self-certification ────────────────────────────────────────────
router.post('/self-certify/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const { declaration } = req.body;

    // Check already certified
    const [existing] = await pool.query(
      'SELECT id FROM self_certifications WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );
    if (existing.length) return res.status(409).json({ message: 'Already self-certified' });

    // Save self-certification
    await pool.query(
      'INSERT INTO self_certifications (id, user_id, course_id, declaration) VALUES (?, ?, ?, ?)',
      [uuidv4(), userId, courseId, declaration || 'I hereby certify that I have completed this course.']
    );

    // Auto-generate certificate
    const year = new Date().getFullYear();
    const seq = Math.floor(Math.random() * 900000) + 100000;
    const certNumber = `OLM-PCI/${year}/${seq}`;

    await pool.query(
      'INSERT INTO certificates (id, certificate_number, user_id, course_id) VALUES (?, ?, ?, ?)',
      [uuidv4(), certNumber, userId, courseId]
    );

    // Mark course as completed
    await pool.query(
      'UPDATE enrollments SET completed_at = NOW() WHERE user_id = ? AND course_id = ?',
      [userId, courseId]
    );

    res.json({ message: 'Self-certification complete! Certificate generated.', certificateNumber: certNumber });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Get certificate data for display/download ────────────────────────────
router.get('/certificate/:courseId', authMiddleware, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const [certs] = await pool.query(
      `SELECT cert.certificate_number, cert.issued_at,
              u.name, u.designation, u.district, u.block, u.gp, u.mobile,
              c.title AS course_name, c.description AS course_description,
              c.total_duration
       FROM certificates cert
       JOIN users u ON cert.user_id = u.id
       JOIN courses c ON cert.course_id = c.id
       WHERE cert.user_id = ? AND cert.course_id = ?`,
      [userId, courseId]
    );

    if (!certs.length) return res.status(404).json({ message: 'Certificate not found' });
    res.json(certs[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ─── ADMIN: All certifications ─────────────────────────────────────────────
router.get('/admin/all', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { district, block, course_id } = req.query;
    let where = ['1=1'];
    const params = [];
    if (district) { where.push('u.district = ?'); params.push(district); }
    if (block)    { where.push('u.block = ?'); params.push(block); }
    if (course_id){ where.push('cert.course_id = ?'); params.push(course_id); }

    const [rows] = await pool.query(
      `SELECT cert.certificate_number, cert.issued_at,
              u.name, u.mobile, u.designation, u.district, u.block, u.gp,
              c.title AS course_name
       FROM certificates cert
       JOIN users u ON cert.user_id = u.id
       JOIN courses c ON cert.course_id = c.id
       WHERE ${where.join(' AND ')}
       ORDER BY cert.issued_at DESC`, params
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
