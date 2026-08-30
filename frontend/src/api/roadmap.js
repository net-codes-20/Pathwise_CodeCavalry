/**
 * frontend/src/api/roadmap.js — matches contracts/api_endpoints.md
 */
import { apiGet, apiPost } from "./client.js";

export function generateRoadmap(profileId) {
  return apiPost("/roadmap/generate", { profile_id: profileId });
}

export function getRoadmap(roadmapId) {
  return apiGet(`/roadmap/${roadmapId}`);
}

export function explainItem(roadmapId, roadmapItemId) {
  return apiPost(`/roadmap/${roadmapId}/explain`, { roadmap_item_id: roadmapItemId });
}

export function sendFeedback(roadmapId, roadmapItemId, action, note) {
  return apiPost(`/roadmap/${roadmapId}/feedback`, { roadmap_item_id: roadmapItemId, action, note });
}

export function replanRoadmap(roadmapId) {
  return apiPost(`/roadmap/${roadmapId}/replan`, { roadmap_id: roadmapId });
}
