import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  severity:    { type: String, enum: ['critical', 'high', 'medium', 'low'], required: true },
  type:        { type: String, required: true },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  platform:    { type: String, default: 'Shopee' },
  product:     { type: String, default: '' },
  sellerName:  { type: String, default: '' },
  dismissed:   { type: Boolean, default: false },
  resolved:    { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Alert', alertSchema);