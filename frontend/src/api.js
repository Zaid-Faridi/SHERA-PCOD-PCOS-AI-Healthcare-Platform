const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

/**
 * Robust fetch wrapper that attaches Authorization header, verifies response.ok,
 * and throws an error with the server message on failures.
 *
 * @param {string} endpoint - API path (e.g. '/api/assess') or full URL
 * @param {RequestInit} [options={}] - Standard fetch options
 * @returns {Promise<any>} Parsed response data
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL.replace(/\/$/, '')}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers = { ...options.headers };

  // Attempt to load auth token from local storage
  let token = null;
  try {
    token = localStorage.getItem('token');
    if (!token) {
      const userStr = localStorage.getItem('shera_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        token = u?.token;
      }
    }
  } catch (e) {
    // Ignore storage parse issues
  }

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Do not set Content-Type header if sending FormData (browser automatically generates multipart boundary)
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type') || '';
  let data;
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const errorMsg =
      (typeof data === 'object' && data !== null && (data.message || data.error)) ||
      (typeof data === 'string' && data.length > 0 ? data : `Request failed with status ${response.status}`);

    const error = new Error(errorMsg);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export default {
  apiRequest,
  baseUrl: API_BASE_URL
};
