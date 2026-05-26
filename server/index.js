import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

import Product  from './models/Product.js';
import Seller   from './models/Seller.js';
import Alert    from './models/Alert.js';
import Setting  from './models/Setting.js';

import productRoutes  from './routes/products.js';
import sellerRoutes   from './routes/sellers.js';
import alertRoutes    from './routes/alerts.js';
import cartRoutes     from './routes/cart.js';
import settingRoutes  from './routes/settings.js';

const app  = express();
const PORT = process.env.PORT || 5000;
const URI  = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopguard';

// Middleware — explicit CORS for browser extension compatibility
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/products',  productRoutes);
app.use('/api/sellers',   sellerRoutes);
app.use('/api/alerts',    alertRoutes);
app.use('/api/cart',      cartRoutes);
app.use('/api/settings',  settingRoutes);

// Dashboard
app.get('/api/dashboard', async (req, res) => {
  try {
    const [
      totalProducts, verifiedProducts, bogusProducts,
      totalSellers, blockedSellers, flaggedSellers,
      activeAlerts, recentAlerts
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ status: 'verified' }),
      Product.countDocuments({ status: 'bogus' }),
      Seller.countDocuments(),
      Seller.countDocuments({ status: 'blocked' }),
      Seller.countDocuments({ status: 'flagged' }),
      Alert.countDocuments({ dismissed: false, resolved: false }),
      Alert.find({ dismissed: false }).sort({ createdAt: -1 }).limit(5).lean()
    ]);

    res.json({
      stats: { totalProducts, verifiedProducts, bogusProducts, totalSellers, blockedSellers, flaggedSellers, activeAlerts },
      recentAlerts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Start
mongoose.connect(URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () => {
      console.log(`\n🚀  ShopGuard API  →  http://localhost:${PORT}`);
      console.log(`📡  Health check    →  http://localhost:${PORT}/api/health`);
      console.log(`📊  Dashboard       →  http://localhost:${PORT}/api/dashboard\n`);
    });
  })
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });