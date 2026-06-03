import { useState, useEffect } from "react"; 
import { 
  productsAPI, 
  sellersAPI, 
  alertsAPI, 
  settingsAPI, 
  dashboardAPI, 
} from "./api"; 
 
/* ================= TYPES ================= */ 
 
interface Product { 
  _id: string; 
  name: string; 
  price: number; 
  image: string; 
  category?: string; 
  rating?: number; 
  reviews?: number; 
  status: "verified" | "bogus" | "pending"; 
  platform: string; 
} 
 
interface Seller { 
  _id: string; 
  name: string; 
  platform: string; 
  products: number; 
  reports: number; 
  rating: number; 
  status: "verified" | "bogus" | "flagged" | "blocked"; 
} 
 
interface Alert { 
  _id: string; 
  severity: string; 
  title: string; 
  description: string; 
} 
 
interface SettingItem { 
  id: string; 
  title: string; 
  description: string; 
  enabled: boolean; 
} 
 
interface SettingCategory { 
  _id: string; 
  category: string; 
  settings: SettingItem[]; 
} 
 
interface CartItem extends Product { 
  quantity: number; 
} 
 
/* ================= APP ================= */ 
 
export default function App() { 
  const [page, setPage] = useState("dashboard"); 
 
  const [products, setProducts] = useState<Product[]>([]); 
  const [sellers, setSellers] = useState<Seller[]>([]); 
  const [alerts, setAlerts] = useState<Alert[]>([]); 
  const [recentAlerts, setRecentAlerts] = useState<Alert[]>([]); 
  const [settings, setSettings] = useState<SettingCategory[]>([]); 
  const [cart, setCart] = useState<CartItem[]>([]); 
  const [loading, setLoading] = useState(true); 
 
  const [stats, setStats] = useState({ 
    totalProducts: 0, 
    totalSellers: 0, 
    bogusProducts: 0, 
    activeAlerts: 0, 
  }); 
 
  /* ================= LOAD DATA ================= */ 
 
  useEffect(() => { 
    loadData(); 
  }, []); 
 
  const loadData = async () => { 
    try { 
      setLoading(true); 
 
      const [ 
        productsData, 
        sellersData, 
        alertsData, 
        settingsData, 
        dashboardData, 
      ] = await Promise.all([ 
        productsAPI.getAll(), 
        sellersAPI.getAll(), 
        alertsAPI.getAll(), 
        settingsAPI.getAll(), 
        dashboardAPI.get(), 
      ]); 
 
      setProducts(productsData); 
      setSellers(sellersData); 
      setAlerts(alertsData); 
      setSettings(settingsData); 
 
      if (dashboardData.stats) setStats(dashboardData.stats); 
      if (dashboardData.recentAlerts) 
        setRecentAlerts(dashboardData.recentAlerts); 
    } finally { 
      setLoading(false); 
    } 
  }; 
 
  /* ================= CART ================= */ 
 
  const addToCart = (product: Product) => { 
    setCart((prev) => { 
      const existing = prev.find((i) => i._id === product._id); 
 
      if (existing) { 
        return prev.map((i) => 
          i._id === product._id 
            ? { ...i, quantity: i.quantity + 1 } 
            : i 
        ); 
      } 
 
      return [...prev, { ...product, quantity: 1 }]; 
    }); 
  }; 
 
  const removeFromCart = (id: string) => { 
    setCart((prev) => prev.filter((i) => i._id !== id)); 
  }; 
 
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0); 
 
  const cartTotal = cart.reduce( 
    (sum, i) => sum + i.price * i.quantity, 
    0 
  ); 
 
  /* ================= DELETE ================= */ 
 
  const deleteProduct = async (id: string) => { 
    if (!confirm("Delete this product?")) return; 
    await productsAPI.delete(id); 
    loadData(); 
  }; 
 
  const deleteSeller = async (id: string) => { 
    if (!confirm("Delete this seller?")) return; 
    await sellersAPI.delete(id); 
    loadData(); 
  }; 
 
  /* ================= SELLERS ================= */ 
 
  const blockSeller = async (id: string) => { 
    await sellersAPI.block(id, "Blocked by admin"); 
    loadData(); 
  }; 
 
  const unblockSeller = async (id: string) => { 
    await sellersAPI.unblock(id); 
    loadData(); 
  }; 
 
  /* ================= ALERTS ================= */ 
 
  const dismissAlert = async (id: string) => { 
    await alertsAPI.dismiss(id); 
    setAlerts((prev) => prev.filter((a) => a._id !== id)); 
  }; 
 
  /* ================= SETTINGS ================= */ 
 
  const toggleSetting = async (category: string, id: string) => { 
    await settingsAPI.toggle(category, id); 
    loadData(); 
  }; 
 
  if (loading) { 
    return ( 
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"> 
        Loading... 
      </div> 
    ); 
  } 
 
  return ( 
    <div className="min-h-screen bg-slate-900 flex text-white"> 
 
      {/* SIDEBAR */} 
      <aside className="w-64 bg-slate-800 p-4 space-y-2"> 
        {["dashboard", "products", "sellers", "alerts", "cart", "settings"].map( 
          (item) => ( 
            <button 
              key={item} 
              onClick={() => setPage(item)} 
              className={`w-full text-left p-3 rounded capitalize ${ 
                page === item ? "bg-cyan-500" : "bg-slate-700" 
              }`} 
            > 
              {item} 
 
              {item === "cart" && cartCount > 0 && ( 
                <span className="ml-2 bg-red-500 px-2 py-0.5 rounded-full text-xs"> 
                  {cartCount} 
                </span> 
              )} 
            </button> 
          ) 
        )} 
      </aside> 
 
      {/* MAIN */} 
      <main className="flex-1 p-6 overflow-auto"> 
 
       {/* ================= DASHBOARD ================= */} 
{page === "dashboard" && ( 
  <div> 
    <h2 className="text-3xl font-bold mb-6">Dashboard</h2> 
 
    {/* TOP STATS */} 
    <div className="grid grid-cols-4 gap-6 mb-8"> 
      <div className="bg-slate-800 p-6 rounded-xl"> 
        <p className="text-slate-400 text-sm">Products</p> 
        <p className="text-3xl font-bold">{stats.totalProducts}</p> 
      </div> 
 
      <div className="bg-slate-800 p-6 rounded-xl"> 
        <p className="text-slate-400 text-sm">Sellers</p> 
        <p className="text-3xl font-bold">{stats.totalSellers}</p> 
      </div> 
 
      <div className="bg-slate-800 p-6 rounded-xl"> 
        <p className="text-slate-400 text-sm">Bogus Products</p> 
        <p className="text-3xl font-bold text-red-400"> 
          {stats.bogusProducts} 
        </p> 
      </div> 
 
      <div className="bg-slate-800 p-6 rounded-xl"> 
        <p className="text-slate-400 text-sm">Alerts</p> 
        <p className="text-3xl font-bold text-yellow-400"> 
          {stats.activeAlerts} 
        </p> 
      </div> 
    </div> 
 
    {/* SYSTEM SUMMARY */} 
    <div className="bg-slate-800 p-6 rounded-xl mb-8"> 
      <h3 className="text-xl font-bold mb-4">System Summary</h3> 
 
      <ul className="space-y-2 text-slate-300"> 
        <li>• {stats.totalProducts} products monitored</li> 
        <li>• {stats.bogusProducts} suspicious products detected</li> 
        <li>• {stats.activeAlerts} active alerts</li> 
      </ul> 
 
      <p className="mt-4 font-semibold"> 
        System Status:{" "} 
        <span 
          className={ 
            stats.activeAlerts > 3 
              ? "text-red-400" 
              : stats.activeAlerts > 0 
              ? "text-yellow-400" 
              : "text-green-400" 
          } 
        > 
          {stats.activeAlerts > 3 
            ? "High Risk" 
            : stats.activeAlerts > 0 
            ? "Moderate Risk" 
            : "Secure"} 
        </span> 
      </p> 
    </div> 
 
    {/* LOWER GRID */} 
    <div className="grid grid-cols-2 gap-8"> 
      {/* RECENT ALERTS */} 
      <div className="bg-slate-800 p-6 rounded-xl"> 
        <h3 className="text-xl font-bold mb-4">Recent Alerts</h3> 
 
        <div className="space-y-4"> 
          {recentAlerts.map((alert) => ( 
            <div key={alert._id} className="border-b border-slate-700 pb-3"> 
              <p className="font-semibold">{alert.title}</p> 
              <p className="text-sm text-slate-400 uppercase"> 
                {alert.severity} 
              </p> 
            </div> 
          ))} 
        </div> 
      </div> 
 
      {/* RECENT PRODUCTS */} 
      <div className="bg-slate-800 p-6 rounded-xl"> 
        <h3 className="text-xl font-bold mb-4"> 
          Recently Added Products 
        </h3> 
 
        <div className="space-y-4"> 
          {products.slice(0, 5).map((product) => ( 
            <div key={product._id} className="border-b border-slate-700 pb-3"> 
              <p className="font-semibold">{product.name}</p> 
              <p className="text-sm text-slate-400"> 
                ₱{product.price} 
              </p> 
            </div> 
          ))} 
        </div> 
      </div> 
    </div> 
  </div> 
)} 
 
        {/* ================= PRODUCTS ================= */} 
 
        {page === "products" && ( 
          <div> 
            <h2 className="text-3xl font-bold mb-6">Products</h2> 
 
            <div className="grid grid-cols-3 gap-6"> 
              {products.map((product) => ( 
                <div 
                  key={product._id} 
                  className="bg-slate-800 rounded-xl overflow-hidden" 
                > 
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-48 object-cover" 
                  /> 
                  <div className="p-4"> 
                    <h3 className="text-lg font-bold mb-1">{product.name}</h3> 
                    <p className="text-slate-400 text-sm mb-1"> 
                      {product.platform} 
                    </p> 
                    <p className="text-cyan-400 font-bold mb-2"> 
                      ₱{product.price} 
                    </p> 
                    <span 
                      className={`text-xs font-bold px-2 py-1 rounded-full ${ 
                        product.status === "verified" 
                          ? "bg-green-600" 
                          : product.status === "bogus" 
                          ? "bg-red-600" 
                          : "bg-yellow-600" 
                      }`} 
                    > 
                      {product.status.toUpperCase()} 
                    </span> 
 
                    <div className="flex gap-2 mt-4"> 
                      <button 
                        onClick={() => addToCart(product)} 
                        className="bg-cyan-600 px-3 py-2 rounded text-sm flex-1" 
                      > 
                        Add to Cart 
                      </button> 
                      <button 
                        onClick={() => deleteProduct(product._id)} 
                        className="bg-red-600 px-3 py-2 rounded text-sm" 
                      > 
                        Delete 
                      </button> 
                    </div> 
                  </div> 
                </div> 
              ))} 
            </div> 
          </div> 
        )} 
 
        {/* ================= SELLERS ================= */} 
 
        {page === "sellers" && ( 
          <div> 
            <h2 className="text-3xl font-bold mb-6">Sellers</h2> 
 
            <div className="space-y-4"> 
              {sellers.map((seller) => ( 
                <div 
                  key={seller._id} 
                  className="bg-slate-800 p-6 rounded-xl flex justify-between items-center" 
                > 
                  <div> 
                    <h3 className="text-lg font-bold">{seller.name}</h3> 
                    <p className="text-slate-400 text-sm"> 
                      {seller.platform} · {seller.products} products ·{" "} 
                      {seller.reports} reports 
                    </p> 
                    <p className="text-sm mt-1"> 
                      Rating:   {seller.rating} 
                    </p> 
                  </div> 
 
                  <div className="flex items-center gap-3"> 
                    <span 
                      className={`text-xs font-bold px-3 py-1 rounded-full ${ 
                        seller.status === "verified" 
                          ? "bg-green-600" 
                          : seller.status === "bogus" 
                          ? "bg-red-600" 
                          : seller.status === "blocked" 
                          ? "bg-gray-600" 
                          : "bg-yellow-600" 
                      }`} 
                    > 
                      {seller.status.toUpperCase()} 
                    </span> 
 
                    {seller.status !== "blocked" ? ( 
                      <button 
                        onClick={() => blockSeller(seller._id)} 
                        className="bg-red-600 px-3 py-2 rounded text-sm" 
                      > 
                        Block 
                      </button> 
                    ) : ( 
                      <button 
                        onClick={() => unblockSeller(seller._id)} 
                        className="bg-green-600 px-3 py-2 rounded text-sm" 
                      > 
                        Unblock 
                      </button> 
                    )} 
 
                    <button 
                      onClick={() => deleteSeller(seller._id)} 
                      className="bg-red-600 px-3 py-2 rounded text-sm" 
                    > 
                      Delete 
                    </button> 
                  </div> 
                </div> 
              ))} 
            </div> 
          </div> 
        )} 
 
        {/* ================= ALERTS ================= */} 
 
        {page === "alerts" && ( 
          <div> 
            <h2 className="text-3xl font-bold mb-6">Alerts</h2> 
 
            {alerts.length === 0 && ( 
              <p className="text-slate-400">No alerts</p> 
            )} 
 
            <div className="space-y-4"> 
              {alerts.map((alert) => ( 
                <div 
                  key={alert._id} 
                  className="bg-slate-800 p-6 rounded-xl flex justify-between items-center" 
                > 
                  <div> 
                    <h3 className="text-lg font-bold">{alert.title}</h3> 
                    <p className="text-slate-400 text-sm"> 
                      {alert.description} 
                    </p> 
                  </div> 
 
                  <div className="flex items-center gap-3"> 
                    <span 
                      className={`text-xs font-bold px-3 py-1 rounded-full ${ 
                        alert.severity === "high" 
                          ? "bg-red-600" 
                          : alert.severity === "medium" 
                          ? "bg-yellow-600" 
                          : "bg-green-600" 
                      }`} 
                    > 
                      {alert.severity.toUpperCase()} 
                    </span> 
 
                    <button 
                      onClick={() => dismissAlert(alert._id)} 
                      className="bg-slate-700 px-3 py-2 rounded text-sm" 
                    > 
                      Dismiss 
                    </button> 
                  </div> 
                </div> 
              ))} 
            </div> 
          </div> 
        )} 
 
        {/* ================= CART ================= */} 
 
        {page === "cart" && ( 
          <div> 
            <h2 className="text-3xl font-bold mb-6">Cart</h2> 
 
            {cart.length === 0 && ( 
              <p className="text-slate-400">Cart is empty</p> 
            )} 
 
            <div className="space-y-6"> 
              {cart.map((item) => ( 
                <div 
                  key={item._id} 
                  className="bg-slate-800 rounded-xl p-6 flex gap-6" 
                > 
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="w-40 h-40 object-cover rounded-lg" 
                  /> 
 
                  <div className="flex-1"> 
                    <h3 className="text-xl font-bold mb-2"> 
                      {item.name} 
                    </h3> 
 
                    <p> 
                      <span className="text-slate-400">Platform:</span>{" "} 
                      {item.platform} 
                    </p> 
 
                    <p> 
                      <span className="text-slate-400">Price:</span>{" "} 
                      ₱{item.price} 
                    </p> 
 
                    <p> 
                      <span className="text-slate-400">Quantity:</span>{" "} 
                      {item.quantity} 
                    </p> 
 
                    <p> 
                      <span className="text-slate-400">Subtotal:</span>{" "} 
                      ₱{(item.price * item.quantity).toFixed(2)} 
                    </p> 
 
                    <p className="mb-3"> 
                      <span className="text-slate-400">Status:</span>{" "} 
                      <span 
                        className={`font-semibold ${ 
                          item.status === "bogus" 
                            ? "text-red-400" 
                            : item.status === "verified" 
                            ? "text-green-400" 
                            : "text-yellow-400" 
                        }`} 
                      > 
                        {item.status.toUpperCase()} 
                      </span> 
                    </p> 
 
                    <button 
                      onClick={() => removeFromCart(item._id)} 
                      className="bg-red-600 px-4 py-2 rounded" 
                    > 
                      Remove 
                    </button> 
                  </div> 
                </div> 
              ))} 
            </div> 
 
            {cart.length > 0 && ( 
              <div className="mt-8 text-right"> 
                <h3 className="text-xl font-bold"> 
                  Total: ₱{cartTotal.toFixed(2)} 
                </h3> 
              </div> 
            )} 
          </div> 
        )} 
 
        {/* ================= SETTINGS ================= */} 
 
        {page === "settings" && ( 
          <div> 
            <h2 className="text-3xl font-bold mb-6">Settings</h2> 
 
            <div className="space-y-8"> 
              {settings.map((cat) => ( 
                <div key={cat._id}> 
                  <h3 className="text-xl font-bold mb-4 capitalize"> 
                    {cat.category} 
                  </h3> 
 
                  <div className="space-y-3"> 
                    {cat.settings.map((s) => ( 
                      <div 
                        key={s.id} 
                        className="bg-slate-800 p-4 rounded-xl flex justify-between items-center" 
                      > 
                        <div> 
                          <p className="font-semibold">{s.title}</p> 
                          <p className="text-slate-400 text-sm"> 
                            {s.description} 
                          </p> 
                        </div> 
 
                        <button 
                          onClick={() => toggleSetting(cat.category, s.id)} 
                          className={`w-14 h-7 rounded-full relative transition-colors ${ 
                            s.enabled ? "bg-cyan-500" : "bg-slate-600" 
                          }`} 
                        > 
                          <span 
                            className={`absolute top-0.5 w-6 h-6 bg-white rounded-full transition-transform 
${ 
                              s.enabled ? "left-7" : "left-0.5" 
                            }`} 
                          /> 
                        </button> 
                      </div> 
                    ))} 
                  </div> 
                </div> 
              ))} 
            </div> 
          </div> 
        )} 
 
      </main> 
    </div> 
  ); 
}