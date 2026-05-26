import { Router } from 'express';
import Alert from '../models/Alert.js';

const router = Router();

// GET /api/alerts/stats
router.get('/stats', async (req, res) => {
  try {
    const total   = await Alert.countDocuments();
    const active  = await Alert.countDocuments({ dismissed: false, resolved: false });
    const dismissed = await Alert.countDocuments({ dismissed: true });
    res.json({ total, active, dismissed });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts
router.get('/', async (req, res) => {
  try {
    const { severity, platform, dismissed, limit = 50 } = req.query;
    const filter = {};
    if (severity)  filter.severity = severity;
    if (platform)  filter.platform = platform;
    if (dismissed !== undefined) filter.dismissed = dismissed === 'true';

    const alerts = await Alert.find(filter).sort({ createdAt: -1 }).limit(Number(limit)).lean();
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/:id
router.get('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id).lean();
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts
router.post('/', async (req, res) => {
  try {
    const alert = await Alert.create(req.body);
    res.status(201).json(alert);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/alerts/:id/dismiss
router.put('/:id/dismiss', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { dismissed: true }, { new: true });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/alerts/:id/resolve
router.put('/:id/resolve', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { resolved: true }, { new: true });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json({ message: 'Alert deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;