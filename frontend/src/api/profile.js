/**
 * frontend/src/api/profile.js — matches contracts/api_endpoints.md
 */
import { apiGet, apiPost, apiPut } from "./client.js";

export function parseProfile(learnerId, rawText) {
  return apiPost("/profile/parse", { learner_id: learnerId, raw_text: rawText });
}

export function createProfile(learnerId, profileFields) {
  return apiPost("/profile", { learner_id: learnerId, ...profileFields });
}

export function getProfile(profileId) {
  return apiGet(`/profile/${profileId}`);
}

export function updateProfile(profileId, updates) {
  return apiPut(`/profile/${profileId}`, updates);
}
