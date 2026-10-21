/**
 * AI Inference Service Client (Node.js -> Flask on port 5000)
 * Sends X-Service-Key authentication header whenever AI_SERVICE_KEY is configured.
 */

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
const AI_SERVICE_KEY = process.env.AI_SERVICE_KEY || '';

/**
 * Builds request headers including the X-Service-Key if configured.
 * @param {Record<string, string>} extraHeaders
 * @returns {Record<string, string>}
 */
const getServiceHeaders = (extraHeaders = {}) => {
  const headers = { ...extraHeaders };
  if (AI_SERVICE_KEY) {
    headers['X-Service-Key'] = AI_SERVICE_KEY;
  }
  return headers;
};

/**
 * Check AI service health status
 */
const checkHealth = async () => {
  const response = await fetch(`${AI_SERVICE_URL}/api/health`, {
    method: 'GET',
    headers: getServiceHeaders()
  });
  return response.json();
};

/**
 * Request tabular clinical prediction
 * @param {Record<string, any>} clinicalData
 */
const predictTabular = async (clinicalData) => {
  const response = await fetch(`${AI_SERVICE_URL}/api/predict/tabular`, {
    method: 'POST',
    headers: getServiceHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(clinicalData)
  });
  return response.json();
};

/**
 * Request combined multi-modal diagnostic prediction
 * @param {Record<string, any> | FormData} payload
 * @param {boolean} isJson
 */
const predictCombined = async (payload, isJson = true) => {
  const headers = isJson ? getServiceHeaders({ 'Content-Type': 'application/json' }) : getServiceHeaders();
  const body = isJson ? JSON.stringify(payload) : payload;

  const response = await fetch(`${AI_SERVICE_URL}/api/predict/combined`, {
    method: 'POST',
    headers,
    body
  });
  return response.json();
};

module.exports = {
  AI_SERVICE_URL,
  AI_SERVICE_KEY,
  getServiceHeaders,
  checkHealth,
  predictTabular,
  predictCombined
};
