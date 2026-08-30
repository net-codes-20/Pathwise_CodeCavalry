import { apiPost } from "./client.js";
import { explainItem } from "./roadmap.js";

/**
 * AI Mentor service.
 * Integrates with /api/mentor/chat and /api/roadmap/{id}/explain for contextual assistance.
 */

export async function askMentor({ message, roadmapId, roadmap, profile, currentItem }) {
  const query = message.trim();
  const lower = query.toLowerCase();

  // If asking explicitly "why" about a specific module, try explainItem first
  if (roadmapId && (lower.startsWith("why ") || lower.includes("why this") || lower.includes("why is this"))) {
    const matchedItem = (roadmap?.items || []).find((item) => {
      const title = item.resource?.title?.toLowerCase() || "";
      return lower.includes(title) || (currentItem && item.id === currentItem.id);
    });

    const targetItem = matchedItem || currentItem;
    if (targetItem) {
      const res = await explainItem(roadmapId, targetItem.id);
      if (res.ok && res.data?.explanation) {
        return {
          ok: true,
          text: `**Regarding ${targetItem.resource?.title || "this topic"}:**\n\n${res.data.explanation}`,
        };
      }
    }
  }

  // Call backend AI Mentor endpoint
  try {
    const res = await apiPost("/mentor/chat", {
      message: query,
      learner_profile_id: profile?.id,
      roadmap_id: roadmapId,
      current_item_id: currentItem?.id,
    });

    if (res.ok && res.data?.reply) {
      return {
        ok: true,
        text: res.data.reply,
      };
    }
  } catch (err) {
    console.warn("Backend mentor call failed, using client fallback", err);
  }

  // Contextual client-side fallback if backend is unreachable
  const targetGoal = profile?.goal || "AI & Software Engineering";
  if (lower.includes("what is ai") || lower.includes("what is artificial intelligence")) {
    return {
      ok: true,
      text: `**Artificial Intelligence (AI)** is the capability of computational systems to perform tasks typically requiring human intelligence—like learning, reasoning, and problem-solving. In your pathway toward **${targetGoal}**, you'll master how data, math, and code combine to train real-world predictive models!`,
    };
  }

  if (lower.includes("what to do next") || lower.includes("what next") || lower.includes("next step")) {
    if (currentItem) {
      return {
        ok: true,
        text: `Your current active focus is **${currentItem.resource?.title}** (${currentItem.resource?.duration_hours}h, ${currentItem.resource?.level}). Review the core concepts and test your understanding with a mini code implementation!`,
      };
    }
    return {
      ok: true,
      text: `Head over to your **Home Dashboard** or **Roadmap** to work on your current module. Aim for 30-45 minutes of focused study today!`,
    };
  }

  return {
    ok: true,
    text: `As your AI Learning Mentor for **${targetGoal}**, I'm here to help explain concepts, recommend study techniques, and guide your daily progress. Ask me any question!`,
  };
}
