import { Router } from 'express';
import Product from '../models/Product.js';

const router = Router();

// GET /api/products/stats
router.get('/stats', async (req, res) => {
  try {
    const total    = await Product.countDocuments();
    const verified = await Product.countDocuments({ status: 'verified' });
    const bogus    = await Product.countDocuments({ status: 'bogus' });
    const pending  = await Product.countDocuments({ status: 'pending' });
    res.json({ total, verified, bogus, pending });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { search, platform, status, category, sort, limit = 50 } = req.query;
    const filter = {};
    if (search)   filter.name = { $regex: search, $options: 'i' };
    if (platform) filter.platform = platform;
    if (status)   filter.status = status;
    if (category) filter.category = category;

    let sortObj = { createdAt: -1 };
    if (sort === 'price_asc')  sortObj = { price: 1 };
    if (sort === 'price_desc') sortObj = { price: -1 };
    if (sort === 'rating')     sortObj = { rating: -1 };

    const products = await Product.find(filter).sort(sortObj).limit(Number(limit)).lean();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products
router.post('/', async (req, res) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/products/:id
router.put('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/products/:id
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;