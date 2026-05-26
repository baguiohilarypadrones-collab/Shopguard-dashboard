import mongoose from 'mongoose';

const settingItemSchema = new mongoose.Schema({
  id:          { type: String, required: true },
  title:       { type: String, required: true },
  description: { type: String, default: '' },
  enabled:     { type: Boolean, default: true }
});

const settingSchema = new mongoose.Schema({
  category: { type: String, required: true },
  settings: [settingItemSchema]
}, { timestamps: true });

export default mongoose.model('Setting', settingSchema);