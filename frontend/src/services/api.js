/**
 * Frontend API Client for AI Study Support Agent
 * Automatically connects to backend on Render (https://study-support-1.onrender.com) or localhost.
 */

const API_BASE = 
  import.meta.env.VITE_API_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:5000'
    : 'https://study-support-1.onrender.com');

/**
 * Generic fetch wrapper with JSON error handling
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Tool 1: Material Search
export async function searchMaterial(query) {
  return request(`/api/materials/search?query=${encodeURIComponent(query)}`);
}

// Tool 2: Knowledge Assessment Evaluation (Application code scoring)
export async function evaluateAssessment(payload) {
  // Try /api/assess first (compatible with both deployed Render and local), fallback to /api/assessment/evaluate
  try {
    return await request('/api/assess', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (err) {
    if (err.status === 404) {
      return await request('/api/assessment/evaluate', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
    throw err;
  }
}

// Tool 3: Save Study Plan (Remote PostgreSQL)
export async function saveStudyPlan(payload) {
  return request('/api/study-plans', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

// Retrieve all saved study plans from DB
export async function getStudyPlans() {
  try {
    return await request('/api/study-plans');
  } catch (err) {
    // If Render hasn't redeployed the latest GET endpoint yet, return empty list gracefully
    if (err.status === 404) {
      return [];
    }
    throw err;
  }
}

// Reopen study plan by ID from DB
export async function getStudyPlanById(id) {
  return request(`/api/study-plans/${encodeURIComponent(id)}`);
}

// Get course materials
export async function getMaterials() {
  return request('/api/materials');
}

// Check backend health & database connectivity
export async function checkBackendHealth() {
  return request('/health');
}

export { API_BASE };
