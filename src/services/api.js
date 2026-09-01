const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('eventgen_access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const url = `${API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // If 401 Unauthorized, try refreshing access token
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshToken = localStorage.getItem('eventgen_refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken })
          });
          const refreshData = await refreshRes.json();
          if (refreshData.success && refreshData.accessToken) {
            localStorage.setItem('eventgen_access_token', refreshData.accessToken);
            headers.Authorization = `Bearer ${refreshData.accessToken}`;
            // Retry original request
            const retryRes = await fetch(url, { ...options, headers });
            return await retryRes.json();
          }
        } catch (e) {
          // Token refresh failed
        }
      }

      // Logout and redirect to login
      localStorage.removeItem('eventgen_access_token');
      localStorage.removeItem('eventgen_refresh_token');
      localStorage.removeItem('eventgen_user');
      window.location.href = '/login';
    }

    const data = await response.json();
    if (!response.ok && !data.result) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`[API Error] ${endpoint}:`, error.message);
    throw error;
  }
}

export const api = {
  get: (url, params) => {
    let endpoint = url;
    if (params) {
      const query = new URLSearchParams(
        Object.entries(params).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      ).toString();
      if (query) endpoint += `?${query}`;
    }
    return apiRequest(endpoint, { method: 'GET' });
  },
  post: (url, body) => apiRequest(url, { method: 'POST', body: JSON.stringify(body) }),
  put: (url, body) => apiRequest(url, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (url) => apiRequest(url, { method: 'DELETE' })
};
