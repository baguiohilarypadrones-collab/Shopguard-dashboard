import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';
import Seller from './models/Seller.js';
import Alert from './models/Alert.js';
import Setting from './models/Setting.js';

dotenv.config();

const URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/shopguard';

const products = [
  { name: 'Sony WH-1000XM5 Headphones', price: 279.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop', category: 'Electronics', platform: 'Shopee', rating: 4.8, reviews: 12847, status: 'verified', inStock: true, sellerName: 'TechZone Official', sellerId: '101' },
  { name: 'Apple iPad Pro 12.9-inch', price: 899.00, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop', category: 'Electronics', platform: 'Shopee', rating: 4.9, reviews: 8621, status: 'verified', inStock: true, sellerName: 'TechZone Official', sellerId: '101' },
  { name: 'Nike Air Max 270', price: 89.99, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop', category: 'Footwear', platform: 'Lazada', rating: 2.1, reviews: 234, status: 'bogus', inStock: true, sellerName: 'QuickDealz', sellerId: '103' },
  { name: 'Samsung 65" QLED 4K TV', price: 799.99, image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&h=300&fit=crop', category: 'Electronics', platform: 'Shopee', rating: 4.6, reviews: 5432, status: 'verified', inStock: true, sellerName: 'MegaStore Pro', sellerId: '106' },
  { name: 'Dyson V15 Detect Vacuum', price: 649.99, image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=300&fit=crop', category: 'Home Appliances', platform: 'Shopee', rating: 4.7, reviews: 3891, status: 'verified', inStock: true, sellerName: 'ElectroHub', sellerId: '102' },
  { name: "Levi's 501 Original Jeans", price: 59.50, image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&h=300&fit=crop', category: 'Clothing', platform: 'Lazada', rating: 4.3, reviews: 8234, status: 'verified', inStock: true, sellerName: 'Fashion Hub MNL', sellerId: '109' },
  { name: 'KitchenAid Stand Mixer', price: 349.99, image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=300&fit=crop', category: 'Home Appliances', platform: 'Shopee', rating: 4.8, reviews: 15203, status: 'verified', inStock: true, sellerName: 'MegaStore Pro', sellerId: '106' },
  { name: 'GoPro HERO12 Black', price: 399.99, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop', category: 'Electronics', platform: 'Shopee', rating: 4.5, reviews: 2156, status: 'bogus', inStock: true, sellerName: 'FlashSale Live', sellerId: '107' },
  { name: 'AirPods Pro 2nd Gen', price: 249.99, image: 'https://images.unsplash.com/photo-1603351154351-5e2d0600bb77?w=400&h=300&fit=crop', category: 'Electronics', platform: 'Shopee', rating: 4.7, reviews: 23451, status: 'verified', inStock: true, sellerName: 'TechZone Official', sellerId: '101' },
  { name: 'Samsung Galaxy Watch 6', price: 349.99, image: 'https://images.unsplash.com/photo-1546868871-af0de0ae72b3?w=400&h=300&fit=crop', category: 'Electronics', platform: 'Lazada', rating: 4.5, reviews: 5678, status: 'verified', inStock: true, sellerName: 'GadgetWorld PH', sellerId: '108' }
];

const sellers = [
  { name: 'TechZone Official', platform: 'Shopee', products: 142, reports: 0, rating: 4.8, status: 'verified' },
  { name: 'ElectroHub', platform: 'Lazada', products: 89, reports: 2, rating: 4.5, status: 'verified' },
  { name: 'QuickDealz', platform: 'Lazada', products: 23, reports: 47, rating: 1.2, status: 'blocked', reason: 'Counterfeit products and fake reviews' },
  { name: 'StreamSale99', platform: 'Shopee', products: 15, reports: 12, rating: 3.1, status: 'flagged' },
  { name: 'BargainBin', platform: 'Lazada', products: 56, reports: 4, rating: 3.8, status: 'verified' },
  { name: 'MegaStore Pro', platform: 'Shopee', products: 201, reports: 1, rating: 4.6, status: 'verified' },
  { name: 'FlashSale Live', platform: 'Shopee', products: 8, reports: 31, rating: 2.3, status: 'blocked', reason: 'Pressure tactics and misleading countdown timers' },
  { name: 'GadgetWorld PH', platform: 'Lazada', products: 67, reports: 3, rating: 4.2, status: 'verified' },
  { name: 'Fashion Hub MNL', platform: 'Shopee', products: 112, reports: 0, rating: 4.7, status: 'verified' }
];

const alerts = [
  { severity: 'critical', type: 'Fake Countdown Timer', title: 'Countdown Timer Manipulation', description: 'QuickDealz uses a fake countdown timer that resets on reload.', platform: 'Lazada', product: 'Nike Air Max 270', sellerName: 'QuickDealz' },
  { severity: 'critical', type: 'Bait and Switch', title: 'Product Substitution Detected', description: 'FlashSale Live ships counterfeit items instead of genuine products.', platform: 'Shopee', product: 'GoPro HERO12 Black', sellerName: 'FlashSale Live' },
  { severity: 'high', type: 'Hidden Fees', title: 'Undisclosed Shipping Surcharge', description: 'StreamSale99 adds a hidden handling fee only visible at checkout.', platform: 'Shopee', product: 'GoPro HERO12 Black', sellerName: 'StreamSale99' },
  { severity: 'high', type: 'Fake Reviews', title: 'Suspicious Review Pattern', description: 'QuickDealz has 47 five-star reviews posted within 2 hours.', platform: 'Lazada', product: 'Nike Air Max 270', sellerName: 'QuickDealz' },
  { severity: 'medium', type: 'False Scarcity', title: 'False Scarcity Claim', description: "StreamSale99 claims 'Only 2 left!' but product has been listed for weeks.", platform: 'Shopee', product: 'GoPro HERO12 Black', sellerName: 'StreamSale99' }
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(URI);
    console.log('Connected.\n');

    await Promise.all([Product.deleteMany({}), Seller.deleteMany({}), Alert.deleteMany({}), Setting.deleteMany({})]);
    console.log('Cleared old data.');

    const createdProducts = await Product.insertMany(products);
    console.log(`  ✅ ${createdProducts.length} products`);

    const createdSellers = await Seller.insertMany(sellers);
    console.log(`  ✅ ${createdSellers.length} sellers`);

    const createdAlerts = await Alert.insertMany(alerts);
    console.log(`  ✅ ${createdAlerts.length} alerts`);

    await Setting.insertMany([
      { category: 'protection', settings: [
        { id: 'dark-pattern', title: 'Dark Pattern Detection', description: 'Detect manipulative UI patterns', enabled: true },
        { id: 'bogus-block', title: 'Bogus Seller Blocking', description: 'Block fake seller products', enabled: true },
        { id: 'live-warnings', title: 'Live Seller Warnings', description: 'Warn about pressure tactics', enabled: true },
        { id: 'price-compare', title: 'Price Comparison', description: 'Compare prices across platforms', enabled: true }
      ]},
      { category: 'notification', settings: [
        { id: 'critical-alerts', title: 'Critical Alerts', description: 'Push notifications for threats', enabled: true },
        { id: 'seller-blocked', title: 'Seller Blocked', description: 'Notify when sellers blocked', enabled: true },
        { id: 'price-drops', title: 'Price Drops', description: 'Notify on price drops', enabled: false }
      ]}
    ]);
    console.log('  ✅ Settings\n');

    console.log('🎉 Database seeded!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
}

seed();