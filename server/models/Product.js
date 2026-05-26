import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  price:        { type: Number, required: true, min: 0 },
  originalPrice:{ type: Number, default: 0 },
  image:        { type: String, default: '' },
  category:     { type: String, default: 'Others' },
  platform:     { type: String, default: 'Shopee' },
  rating:       { type: Number, default: 0 },
  reviews:      { type: Number, default: 0 },
  status:       { type: String, enum: ['verified', 'bogus', 'pending'], default: 'pending' },
  inStock:      { type: Boolean, default: true },
  url:          { type: String, default: '' },
  sellerName:   { type: String, default: '' },
  sellerId:     { type: String, default: '' }
}, { timestamps: true });

productSchema.index({ name: 'text' });

export default mongoose.model('Product', productSchema);