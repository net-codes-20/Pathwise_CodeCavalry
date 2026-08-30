import { apiPost, apiGet } from "./client.js";

export function getVarkQuestions() {
  return apiGet("/profile/vark/questions");
}

export function scoreVark(learnerId, answers) {
  return apiPost("/profile/vark", { learner_id: learnerId, answers });
}
