// ShopGuard Frontend API Client

const API = 'http://localhost:5000/api';

async function request(endpoint, options = {}) {
  const res = await fetch(`${API}${endpoint}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Health
export const healthAPI = {
  check: () => request('/health')
};

// Products
export const productsAPI = {
  getAll:    (params = {}) => { const q = new URLSearchParams(params); return request(`/products?${q}`); },
  getById:   (id)          => request(`/products/${id}`),
  create:    (data)        => request('/products', { method: 'POST', body: JSON.stringify(data) }),
  update:    (id, data)    => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete:    (id)          => request(`/products/${id}`, { method: 'DELETE' }),
  stats:     ()            => request('/products/stats')
};

// Sellers
export const sellersAPI = {
  getAll:    (params = {}) => { const q = new URLSearchParams(params); return request(`/sellers?${q}`); },
  getById:   (id)          => request(`/sellers/${id}`),
  create:    (data)        => request('/sellers', { method: 'POST', body: JSON.stringify(data) }),
  block:     (id, reason)  => request(`/sellers/${id}/block`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  unblock:   (id)          => request(`/sellers/${id}/unblock`, { method: 'PUT' }),
  flag:      (id, reason)  => request(`/sellers/${id}/flag`, { method: 'PUT', body: JSON.stringify({ reason }) }),
  verify:    (id)          => request(`/sellers/${id}/verify`, { method: 'PUT' }),
  delete:    (id)          => request(`/sellers/${id}`, { method: 'DELETE' }),
  stats:     ()            => request('/sellers/stats')
};

// Alerts
export const alertsAPI = {
  getAll:    (params = {}) => { const q = new URLSearchParams(params); return request(`/alerts?${q}`); },
  getById:   (id)          => request(`/alerts/${id}`),
  create:    (data)        => request('/alerts', { method: 'POST', body: JSON.stringify(data) }),
  dismiss:   (id)          => request(`/alerts/${id}/dismiss`, { method: 'PUT' }),
  resolve:   (id)          => request(`/alerts/${id}/resolve`, { method: 'PUT' }),
  delete:    (id)          => request(`/alerts/${id}`, { method: 'DELETE' }),
  stats:     ()            => request('/alerts/stats')
};

// Cart
const getSessionId = () => {
  let sid = localStorage.getItem('shopguard_session');
  if (!sid) {
    sid = 'session_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
    localStorage.setItem('shopguard_session', sid);
  }
  return sid;
};

export const cartAPI = {
  get:      ()                        => request(`/cart/${getSessionId()}`),
  add:      (productId, quantity = 1) => request(`/cart/${getSessionId()}/add`, { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  remove:   (productId)               => request(`/cart/${getSessionId()}/remove/${productId}`, { method: 'DELETE' }),
  checkout: ()                        => request(`/cart/${getSessionId()}/checkout`, { method: 'POST' })
};

// Settings
export const settingsAPI = {
  getAll:  ()                            => request('/settings'),
  toggle:  (category, id)               => request(`/settings/${category}/toggle/${id}`, { method: 'PUT' })
};

// Dashboard
export const dashboardAPI = {
  get: () => request('/dashboard')
};