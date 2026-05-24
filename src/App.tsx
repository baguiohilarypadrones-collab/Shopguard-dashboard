import { useState } from 'react';

// Types
interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  reviews: number;
  status: 'verified' | 'bogus';
  platform: string;
}

interface Seller {
  id: number;
  name: string;
  platform: string;
  products: number;
  reports: number;
  rating: number;
  status: 'verified' | 'bogus' | 'flagged' | 'blocked';
  reason?: string;
}

interface Alert {
  id: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  title: string;
  description: string;
  platform: string;
  product: string;
  time: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Setting {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

// Data
const initialProducts: Product[] = [
  { id: 1, name: 'Sony WH-1000XM5 Headphones', price: 279.99, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop', category: 'Electronics', rating: 4.8, reviews: 12847, status: 'verified', platform: 'Shopee' },
  { id: 2, name: 'Apple iPad Pro 12.9-inch', price: 899.00, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop', category: 'Electronics', rating: 4.9, reviews: 8621, status: 'verified', platform: 'Shopee' },
  { id: 3, name: 'Nike Air Max 270', price: 89.99, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop', category: 'Footwear', rating: 2.1, reviews: 234, status: 'bogus', platform: 'Lazada' },
  { id: 4, name: 'Samsung 65" QLED 4K TV', price: 799.99, image: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=400&h=300&fit=crop', category: 'Electronics', rating: 4.6, reviews: 5432, status: 'verified', platform: 'Shopee' },
  { id: 5, name: 'Dyson V15 Detect Vacuum', price: 649.99, image: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=400&h=300&fit=crop', category: 'Home Appliances', rating: 4.7, reviews: 3891, status: 'verified', platform: 'Shopee' },
  { id: 6, name: "Levi's 501 Original Jeans", price: 59.50, image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&h=300&fit=crop', category: 'Clothing', rating: 4.3, reviews: 8234, status: 'verified', platform: 'Lazada' },
  { id: 7, name: 'KitchenAid Stand Mixer', price: 349.99, image: 'https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=400&h=300&fit=crop', category: 'Home Appliances', rating: 4.8, reviews: 15203, status: 'verified', platform: 'Shopee' },
  { id: 8, name: 'GoPro HERO12 Black', price: 399.99, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&h=300&fit=crop', category: 'Electronics', rating: 4.5, reviews: 2156, status: 'bogus', platform: 'Shopee' },
];

const initialSellers: Seller[] = [
  { id: 1, name: 'TechZone Official', platform: 'Shopee', products: 142, reports: 0, rating: 4.8, status: 'verified' },
  { id: 2, name: 'ElectroHub', platform: 'Lazada', products: 89, reports: 2, rating: 4.5, status: 'verified' },
  { id: 3, name: 'QuickDealz', platform: 'Shopee', products: 23, reports: 47, rating: 1.2, status: 'blocked', reason: 'Counterfeit products and fake reviews' },
  { id: 4, name: 'StreamSale99', platform: 'Shopee', products: 15, reports: 12, rating: 3.1, status: 'flagged' },
  { id: 5, name: 'BargainBin', platform: 'Lazada', products: 56, reports: 4, rating: 3.8, status: 'verified' },
  { id: 6, name: 'MegaStore Pro', platform: 'Shopee', products: 201, reports: 1, rating: 4.6, status: 'verified' },
  { id: 7, name: 'FlashSale Live', platform: 'Shopee', products: 8, reports: 31, rating: 2.3, status: 'blocked', reason: 'Pressure tactics and misleading countdown timers' },
];

const initialAlerts: Alert[] = [
  { id: 1, severity: 'critical', type: 'Countdown Timer', title: 'Countdown Timer Manipulation', description: 'QuickDealz is using a fake countdown timer that resets every time you reload the page.', platform: 'Lazada', product: 'Nike Air Max 270', time: '7:20 PM' },
  { id: 2, severity: 'critical', type: 'Bait & Switch', title: 'Product Substitution Detected', description: 'FlashSale Live is shipping counterfeit items instead of genuine Nike products.', platform: 'Shopee', product: 'Nike Air Max 270', time: '7:20 PM' },
  { id: 3, severity: 'high', type: 'Hidden Fees', title: 'Undisclosed Shipping Surcharge', description: 'StreamSale99 adds a ₱15 handling fee only visible at checkout.', platform: 'Shopee', product: 'GoPro HERO12', time: '7:20 PM' },
  { id: 4, severity: 'high', type: 'Fake Reviews', title: 'Suspicious Review Pattern', description: 'QuickDealz has 47 5-star reviews posted within a 2-hour window.', platform: 'Lazada', product: 'Nike Air Max 270', time: '7:20 PM' },
  { id: 5, severity: 'medium', type: 'Pressure Tactic', title: 'False Scarcity Claim', description: "StreamSale99 claims 'Only 2 left!' but the same product has been listed for weeks.", platform: 'Shopee', product: 'GoPro HERO12', time: '7:20 PM' },
];

const initialSettings: Setting[] = [
  { id: 'dark-pattern', title: 'Dark Pattern Detection', description: 'Automatically detect manipulative UI patterns', enabled: true },
  { id: 'bogus-block', title: 'Bogus Seller Blocking', description: 'Block products from known bogus sellers', enabled: true },
  { id: 'live-warnings', title: 'Live Seller Warnings', description: 'Show warnings for high-pressure live sellers', enabled: true },
  { id: 'price-compare', title: 'Real-time Price Comparison', description: 'Compare prices across platforms', enabled: true },
  { id: 'critical-alerts', title: 'Critical Alerts', description: 'Immediate notifications for dark patterns', enabled: true },
  { id: 'seller-blocked', title: 'Seller Blocked Notifications', description: 'Notify when a seller is blocked', enabled: true },
  { id: 'price-drops', title: 'Price Drop Notifications', description: 'Notify when tracked products drop in price', enabled: false },
];

// SVG Icon Components
const ShieldIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const GridIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const CartIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const BellIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const AlertTriangleIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

// Reusable Components
function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}

function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  return (
    <div className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="relative">
        <img src={product.image} alt={product.name} className="w-full h-36 object-cover" />
        {product.status === 'bogus' && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
            <AlertTriangleIcon /> Bogus
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white text-sm mb-1 truncate">{product.name}</h3>
        <p className="text-xs text-slate-400 mb-2">{product.category} &bull; {product.platform}</p>
        <div className="flex items-center gap-1 mb-3">
          <span className="text-yellow-400"><StarIcon /></span>
          <span className="text-sm text-slate-300">{product.rating}</span>
          <span className="text-xs text-slate-500">({product.reviews.toLocaleString()})</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-cyan-400 font-bold">₱{product.price.toFixed(2)}</span>
          {product.status === 'verified' ? (
            <span className="text-xs text-green-400 flex items-center gap-1"><CheckIcon /> Verified</span>
          ) : (
            <span className="text-xs text-red-400 flex items-center gap-1"><AlertTriangleIcon /> Bogus</span>
          )}
        </div>
        <button
          onClick={onAdd}
          className="w-full py-2 px-3 bg-slate-700 hover:bg-cyan-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <PlusIcon /> Add to Cart
        </button>
      </div>
    </div>
  );
}

function SellerCard({ seller, onBlock, onUnblock, onFlag }: { seller: Seller; onBlock: () => void; onUnblock: () => void; onFlag: () => void }) {
  const statusColors: Record<string, string> = {
    verified: 'bg-green-500/20 text-green-400',
    bogus: 'bg-red-500/20 text-red-400',
    flagged: 'bg-yellow-500/20 text-yellow-400',
    blocked: 'bg-red-500/20 text-red-400',
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-white">{seller.name}</h3>
            <span className={`text-xs px-2 py-1 rounded font-medium ${statusColors[seller.status]}`}>
              {seller.status.charAt(0).toUpperCase() + seller.status.slice(1)}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>{seller.platform}</span>
            <span>{seller.products} products</span>
            <span>{seller.reports} reports</span>
            <span>&#9733; {seller.rating}</span>
          </div>
          {seller.reason && (
            <p className="text-xs text-red-400 mt-2">{seller.reason}</p>
          )}
        </div>
        <div className="flex gap-2">
          {seller.status === 'blocked' ? (
            <button onClick={onUnblock} className="px-3 py-1.5 text-sm border border-slate-600 rounded-lg hover:border-green-500 hover:text-green-400 transition-colors">
              Unblock
            </button>
          ) : (
            <>
              <button onClick={onBlock} className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                Block
              </button>
              {seller.status !== 'flagged' && (
                <button onClick={onFlag} className="px-3 py-1.5 text-sm border border-slate-600 rounded-lg hover:border-yellow-500 hover:text-yellow-400 transition-colors">
                  Flag
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AlertCard({ alert, onDismiss }: { alert: Alert; onDismiss: () => void }) {
  const severityColors: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500',
  };

  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs px-2 py-1 rounded font-bold text-white ${severityColors[alert.severity]}`}>
              {alert.severity.toUpperCase()}
            </span>
            <span className="text-xs text-slate-500 font-mono">{alert.type}</span>
          </div>
          <h3 className="font-semibold text-white mb-1">{alert.title}</h3>
          <p className="text-sm text-slate-400 mb-3">{alert.description}</p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="text-cyan-400">{alert.platform}</span>
            <span>{alert.product}</span>
            <span>{alert.time}</span>
          </div>
        </div>
        <button onClick={onDismiss} className="px-3 py-1.5 text-sm border border-slate-600 rounded-lg hover:border-slate-400 transition-colors">
          Dismiss
        </button>
      </div>
    </div>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`w-12 h-6 rounded-full transition-colors relative ${enabled ? 'bg-cyan-500' : 'bg-slate-600'}`}
    >
      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${enabled ? 'left-7' : 'left-1'}`} />
    </button>
  );
}

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  return (
    <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-xl flex items-center gap-3 shadow-lg z-50 animate-fade-in ${type === 'success' ? 'bg-green-500/20 border border-green-500/30' : 'bg-red-500/20 border border-red-500/30'}`}>
      <span className={type === 'success' ? 'text-green-400' : 'text-red-400'}>
        {type === 'success' ? <CheckIcon /> : <XIcon />}
      </span>
      <span className="text-white text-sm">{message}</span>
      <button onClick={onClose} className="text-slate-400 hover:text-white"><XIcon /></button>
    </div>
  );
}

// Main App Component
export default function App() {
  const [page, setPage] = useState('dashboard');
  const [products] = useState<Product[]>(initialProducts);
  const [sellers, setSellers] = useState<Seller[]>(initialSellers);
  const [alerts, setAlerts] = useState<Alert[]>(initialAlerts);
  const [settings, setSettings] = useState<Setting[]>(initialSettings);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const addToCart = (product: Product) => {
    if (product.status === 'bogus') {
      showToast('Cannot add bogus products to cart', 'error');
      return;
    }
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    showToast('Added to cart', 'success');
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
    showToast('Removed from cart', 'success');
  };

  const blockSeller = (name: string) => {
    setSellers(sellers.map(s => s.name === name ? { ...s, status: 'blocked', reason: 'Manually blocked by user' } : s));
    showToast(`${name} blocked`, 'success');
  };

  const unblockSeller = (name: string) => {
    setSellers(sellers.map(s => s.name === name ? { ...s, status: 'verified', reason: undefined } : s));
    showToast(`${name} unblocked`, 'success');
  };

  const flagSeller = (name: string) => {
    setSellers(sellers.map(s => s.name === name ? { ...s, status: 'flagged' } : s));
    showToast(`${name} flagged`, 'success');
  };

  const dismissAlert = (id: number) => {
    setAlerts(alerts.filter(a => a.id !== id));
    showToast('Alert dismissed', 'success');
  };

  const toggleSetting = (id: string) => {
    setSettings(settings.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <ShieldIcon /> },
    { id: 'products', label: 'Products', icon: <GridIcon /> },
    { id: 'sellers', label: 'Sellers', icon: <UsersIcon /> },
    { id: 'cart', label: 'Cart', icon: <CartIcon />, badge: cartCount },
    { id: 'alerts', label: 'Alerts', icon: <BellIcon />, badge: alerts.length },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center">
              <ShieldIcon />
            </div>
            <div>
              <h1 className="font-bold text-white text-lg">SHOPGUARD</h1>
              <p className="text-xs text-slate-400">Protection Dashboard</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${page === item.id ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}
            >
              {item.icon}
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-2 text-xs text-green-400">
            <span className="w-2 h-2 bg-green-400 rounded-full"></span>
            System Online
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Dashboard */}
        {page === 'dashboard' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Dashboard</h2>
              <p className="text-slate-400">System overview and protection status</p>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <StatCard icon={<GridIcon />} label="Products" value="8" color="bg-cyan-500/20 text-cyan-400" />
              <StatCard icon={<UsersIcon />} label="Sellers" value="7" color="bg-purple-500/20 text-purple-400" />
              <StatCard icon={<BellIcon />} label="Active Alerts" value={alerts.length.toString()} color="bg-orange-500/20 text-orange-400" />
              <StatCard icon={<CartIcon />} label="Cart Items" value={cartCount.toString()} color="bg-green-500/20 text-green-400" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <h3 className="font-semibold text-white mb-4">Recent Alerts</h3>
                <div className="space-y-3">
                  {alerts.slice(0, 3).map(alert => (
                    <div key={alert.id} className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                      <span className={`w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-500' : alert.severity === 'high' ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                      <span className="text-sm text-white flex-1">{alert.title}</span>
                      <span className="text-xs text-slate-400">{alert.platform}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                <h3 className="font-semibold text-white mb-4">Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center"><span className="text-sm text-slate-400">Verified Products</span><span className="text-sm text-green-400 font-medium">6</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-slate-400">Bogus Products</span><span className="text-sm text-red-400 font-medium">2</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-slate-400">Blocked Sellers</span><span className="text-sm text-red-400 font-medium">2</span></div>
                  <div className="flex justify-between items-center"><span className="text-sm text-slate-400">Flagged Sellers</span><span className="text-sm text-yellow-400 font-medium">1</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        {page === 'products' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Products</h2>
              <p className="text-slate-400">Browse and compare products across platforms</p>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none"
              />
              <span className="absolute left-3 top-3.5 text-slate-400"><SearchIcon /></span>
            </div>
            <div className="grid grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} onAdd={() => addToCart(product)} />
              ))}
            </div>
          </div>
        )}

        {/* Sellers */}
        {page === 'sellers' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Sellers</h2>
              <p className="text-slate-400">Monitor and manage sellers across platforms</p>
            </div>
            <div className="space-y-3">
              {sellers.map(seller => (
                <SellerCard
                  key={seller.id}
                  seller={seller}
                  onBlock={() => blockSeller(seller.name)}
                  onUnblock={() => unblockSeller(seller.name)}
                  onFlag={() => flagSeller(seller.name)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Cart */}
        {page === 'cart' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Secure Cart</h2>
              <p className="text-slate-400">Aggregated cart with dark pattern protection</p>
            </div>
            {cart.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center"><CartIcon /></div>
                <h3 className="text-lg font-semibold text-white mb-2">Your cart is empty</h3>
                <p className="text-slate-400 mb-4">Browse products and add them to your secure cart</p>
                <button onClick={() => setPage('products')} className="px-6 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors">Browse Products</button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-4 bg-slate-800 rounded-xl p-4 border border-slate-700">
                      <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{item.name}</h3>
                        <p className="text-sm text-slate-400">{item.platform} &bull; Qty: {item.quantity}</p>
                        <p className="text-cyan-400 font-bold mt-1">&#8369;{(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="p-2 text-slate-400 hover:text-red-400"><XIcon /></button>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 h-fit">
                  <h3 className="font-semibold text-white mb-4">Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Subtotal</span><span className="text-white">&#8369;{cartTotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Platform Fee</span><span className="text-green-400">&#8369;0.00</span></div>
                    <div className="border-t border-slate-700 pt-3 flex justify-between font-bold"><span className="text-white">Total</span><span className="text-cyan-400">&#8369;{cartTotal.toFixed(2)}</span></div>
                  </div>
                  <button className="w-full mt-4 py-3 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors">Checkout</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Alerts */}
        {page === 'alerts' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Threat Alerts</h2>
              <p className="text-slate-400">Dark pattern detections and warnings</p>
            </div>
            {alerts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center text-green-400"><CheckIcon /></div>
                <h3 className="text-lg font-semibold text-white mb-2">All clear!</h3>
                <p className="text-slate-400 mb-4">No active threats detected</p>
              </div>
            ) : (
              <div className="space-y-4">
                {alerts.map(alert => (
                  <AlertCard key={alert.id} alert={alert} onDismiss={() => dismissAlert(alert.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        {page === 'settings' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Settings</h2>
              <p className="text-slate-400">Configure ShopGuard protection settings</p>
            </div>
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="font-semibold text-white mb-4">Protection Settings</h3>
              <div className="space-y-4">
                {settings.slice(0, 4).map(setting => (
                  <div key={setting.id} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                    <div>
                      <h4 className="font-medium text-white">{setting.title}</h4>
                      <p className="text-sm text-slate-400">{setting.description}</p>
                    </div>
                    <Toggle enabled={setting.enabled} onToggle={() => toggleSetting(setting.id)} />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
              <h3 className="font-semibold text-white mb-4">Notifications</h3>
              <div className="space-y-4">
                {settings.slice(4).map(setting => (
                  <div key={setting.id} className="flex items-center justify-between py-3 border-b border-slate-700 last:border-0">
                    <div>
                      <h4 className="font-medium text-white">{setting.title}</h4>
                      <p className="text-sm text-slate-400">{setting.description}</p>
                    </div>
                    <Toggle enabled={setting.enabled} onToggle={() => toggleSetting(setting.id)} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}