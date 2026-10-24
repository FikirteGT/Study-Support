// Single place that talks to the Express backend. Set VITE_API_URL (e.g. https://study-support-1.onrender.com).
const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(BASE + path, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('Cannot reach the server. Free hosting may be waking up; wait a few seconds and try again.');
  }
  let data = {};
  try { data = await res.json(); } catch { /* non-JSON response */ }
  if (!res.ok) throw new Error(data.error || data.message || `Request failed (${res.status})`);
  return data;
}

export const api = {
  health: () => request('/health'),
  prompt: (topic) => request('/api/agent/prompt', { method: 'POST', body: { prompt: topic } }),
  assess: (quizToken, studentAnswers) => request('/api/assess', { method: 'POST', body: { quizToken, studentAnswers } }),
  savePlan: (payload) => request('/api/plans', { method: 'POST', body: payload }),
  listPlans: () => request('/api/plans'),
  getPlan: (id) => request(`/api/plans/${id}`),
};
