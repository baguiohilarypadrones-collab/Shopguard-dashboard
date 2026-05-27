import { Router } from 'express';
import Seller from '../models/Seller.js';
import Alert from '../models/Alert.js';

const router = Router();

// GET /api/sellers/stats
router.get('/stats', async (req, res) => {
  try {
    const total     = await Seller.countDocuments();
    const blocked   = await Seller.countDocuments({ status: 'blocked' });
    const verified  = await Seller.countDocuments({ status: 'verified' });
    const flagged   = await Seller.countDocuments({ status: 'flagged' });
    const pending   = await Seller.countDocuments({ status: 'pending' });
    res.json({ total, blocked, verified, flagged, pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sellers
router.get('/', async (req, res) => {
  try {
    const { search, platform, status, sort, limit = 50 } = req.query;
    const filter = {};
    if (search)   filter.name = { $regex: search, $options: 'i' };
    if (platform) filter.platform = platform;
    if (status)   filter.status = status;

    let sortObj = { createdAt: -1 };
    if (sort === 'rating')  sortObj = { rating: -1 };
    if (sort === 'reports') sortObj = { reports: -1 };
    if (sort === 'name')    sortObj = { name: 1 };

    const sellers = await Seller.find(filter).sort(sortObj).limit(Number(limit)).lean();
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/sellers/:id
router.get('/:id', async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id).lean();
    if (!seller) return res.status(404).json({ error: 'Seller not found' });
    res.json(seller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sellers
router.post('/', async (req, res) => {
  try {
    const seller = await Seller.create(req.body);
    res.status(201).json(seller);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/sellers/:id/block
router.put('/:id/block', async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      { status: 'blocked', reason: req.body.reason || 'Blocked by user' },
      { new: true }
    );
    if (!seller) return res.status(404).json({ error: 'Seller not found' });

    await Alert.create({
      severity: 'critical',
      type: 'Suspicious Seller',
      title: `Seller Blocked: ${seller.name}`,
      description: `${seller.name} has been blocked on ${seller.platform}. Reason: ${seller.reason}`,
      platform: seller.platform,
      product: 'N/A',
      sellerName: seller.name
    });

    res.json(seller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sellers/:id/unblock
router.put('/:id/unblock', async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      { status: 'verified', reason: '' },
      { new: true }
    );
    if (!seller) return res.status(404).json({ error: 'Seller not found' });
    res.json(seller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sellers/:id/flag
router.put('/:id/flag', async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'flagged' }, $inc: { reports: 1 } },
      { new: true }
    );
    if (!seller) return res.status(404).json({ error: 'Seller not found' });

    await Alert.create({
      severity: 'high',
      type: 'Suspicious Seller',
      title: `Seller Flagged: ${seller.name}`,
      description: `${seller.name} has been flagged for suspicious activity on ${seller.platform}`,
      platform: seller.platform,
      product: 'N/A',
      sellerName: seller.name
    });

    res.json(seller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/sellers/:id/verify
router.put('/:id/verify', async (req, res) => {
  try {
    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      { status: 'verified', reason: '' },
      { new: true }
    );
    if (!seller) return res.status(404).json({ error: 'Seller not found' });
    res.json(seller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/sellers/:id
router.delete('/:id', async (req, res) => {
  try {
    const seller = await Seller.findByIdAndDelete(req.params.id);
    if (!seller) return res.status(404).json({ error: 'Seller not found' });
    res.json({ message: 'Seller deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
