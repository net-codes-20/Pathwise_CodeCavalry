import { apiGet, apiPost, apiPatch } from "./client.js";

/**
 * @param {string} name      Display name
 * @param {string} username  Unique lowercase username
 * @param {string} password  Plaintext (hashed server-side)
 */
export function startLearner(name, username, password) {
  return apiPost("/learner/start", { name, username, password });
}

/**
 * Persist user's theme selection to Supabase
 * @param {string} learnerId
 * @param {string} theme ('light' | 'dark' | 'system')
 */
export function updateLearnerTheme(learnerId, theme) {
  return apiPatch(`/learner/${learnerId}/theme`, { theme });
}

/**
 * Fetch all learning pathways & roadmaps created by a learner
 * @param {string} learnerId
 */
export function getLearnerRoadmaps(learnerId) {
  return apiGet(`/learner/${learnerId}/roadmaps`);
}

/**
 * Update learner account (Display Name and/or Password)
 * @param {string} learnerId
 * @param {{ name?: string, password?: string }} payload
 */
export function updateLearnerAccount(learnerId, payload) {
  return apiPatch(`/learner/${learnerId}/account`, payload);
}
