import { Router } from 'express';
import Cart from '../models/Cart.js';
import Product from '../models/Product.js';

const router = Router();

// GET /api/cart/:sessionId
router.get('/:sessionId', async (req, res) => {
  try {
    let cart = await Cart.findOne({ sessionId: req.params.sessionId, isCheckedOut: false })
      .populate('items.product');
    if (!cart) {
      cart = await Cart.create({ sessionId: req.params.sessionId, items: [] });
    }
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart/:sessionId/add
router.post('/:sessionId/add', async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    let cart = await Cart.findOne({ sessionId: req.params.sessionId, isCheckedOut: false });
    if (!cart) cart = await Cart.create({ sessionId: req.params.sessionId, items: [] });

    const existing = cart.items.find(i => i.product.toString() === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    cart = await Cart.findById(cart._id).populate('items.product');
    res.json(cart);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/cart/:sessionId/remove/:productId
router.delete('/:sessionId/remove/:productId', async (req, res) => {
  try {
    let cart = await Cart.findOne({ sessionId: req.params.sessionId, isCheckedOut: false });
    if (!cart) return res.status(404).json({ error: 'Cart not found' });

    cart.items = cart.items.filter(i => i.product.toString() !== req.params.productId);
    await cart.save();
    cart = await Cart.findById(cart._id).populate('items.product');
    res.json(cart);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart/:sessionId/checkout
router.post('/:sessionId/checkout', async (req, res) => {
  try {
    const cart = await Cart.findOneAndUpdate(
      { sessionId: req.params.sessionId, isCheckedOut: false },
      { isCheckedOut: true },
      { new: true }
    ).populate('items.product');
    if (!cart) return res.status(404).json({ error: 'Cart not found' });
    res.json({ message: 'Checkout successful', cart });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;