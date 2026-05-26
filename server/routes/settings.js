import { Router } from 'express';
import Setting from '../models/Setting.js';

const router = Router();

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    let settings = await Setting.find().lean();
    if (settings.length === 0) {
      settings = await Setting.insertMany([
        {
          category: 'protection',
          settings: [
            { id: 'dark-pattern', title: 'Dark Pattern Detection', description: 'Detect manipulative UI patterns', enabled: true },
            { id: 'bogus-block', title: 'Bogus Seller Blocking', description: 'Block fake seller products', enabled: true },
            { id: 'live-warnings', title: 'Live Seller Warnings', description: 'Warn about pressure tactics', enabled: true },
            { id: 'price-compare', title: 'Price Comparison', description: 'Compare prices across platforms', enabled: true }
          ]
        },
        {
          category: 'notification',
          settings: [
            { id: 'critical-alerts', title: 'Critical Alerts', description: 'Push notifications for threats', enabled: true },
            { id: 'seller-blocked', title: 'Seller Blocked', description: 'Notify when sellers blocked', enabled: true },
            { id: 'price-drops', title: 'Price Drops', description: 'Notify on price drops', enabled: false }
          ]
        }
      ]);
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings/:category/toggle/:id
router.put('/:category/toggle/:id', async (req, res) => {
  try {
    const setting = await Setting.findOne({ category: req.params.category });
    if (!setting) return res.status(404).json({ error: 'Category not found' });

    const item = setting.settings.find(s => s.id === req.params.id);
    if (!item) return res.status(404).json({ error: 'Setting not found' });

    item.enabled = !item.enabled;
    await setting.save();
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;