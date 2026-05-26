import mongoose from 'mongoose';

const sellerSchema = new mongoose.Schema({
  name:     { type: String, required: true, trim: true },
  platform: { type: String, default: 'Shopee' },
  products: { type: Number, default: 0 },
  reports:  { type: Number, default: 0 },
  rating:   { type: Number, default: 0 },
  status:   { type: String, enum: ['verified', 'bogus', 'flagged', 'blocked', 'pending'], default: 'pending' },
  reason:   { type: String, default: '' },
  url:      { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Seller', sellerSchema);