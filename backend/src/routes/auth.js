const router = require('express').Router();
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// Login with mobile number only
router.post('/login', async (req, res) => {
  try {
    const { mobile } = req.body;
    if (!mobile) return res.status(400).json({ message: 'Mobile number required' });

    const [rows] = await pool.query('SELECT * FROM users WHERE mobile = ?', [mobile]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Mobile number not registered. Please register first.' });
    }

    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, mobile: user.mobile, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, name: user.name, mobile: user.mobile, role: user.role, district: user.district, block: user.block, gp: user.gp, designation: user.designation } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Register new learner
router.post('/register', async (req, res) => {
  try {
    const { mobile, name, designation, district, block, gp } = req.body;
    if (!mobile || !name) return res.status(400).json({ message: 'Mobile and name are required' });

    const [existing] = await pool.query('SELECT id FROM users WHERE mobile = ?', [mobile]);
    if (existing.length > 0) return res.status(409).json({ message: 'Mobile number already registered' });

    const id = uuidv4();
    await pool.query(
      'INSERT INTO users (id, mobile, name, designation, district, block, gp, role) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, mobile, name, designation || null, district || null, block || null, gp || null, 'learner']
    );

    const token = jwt.sign({ id, mobile, role: 'learner' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id, name, mobile, role: 'learner', district, block, gp, designation } });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
