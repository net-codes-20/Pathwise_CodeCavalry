import { createContext, useContext, useState, useEffect } from "react";
import { getRoadmap } from "../api/roadmap.js";
import { getProfile } from "../api/profile.js";
import { updateLearnerTheme } from "../api/learner.js";

const DRAFT_STORAGE_KEY = "learning_onboarding_draft";
const SESSION_STORAGE_KEY = "learning_session";
const ROADMAPS_CACHE_KEY_PREFIX = "learner_roadmaps_cache_";

export function getCachedRoadmaps(learnerId) {
  if (!learnerId) return [];
  try {
    const raw = localStorage.getItem(`${ROADMAPS_CACHE_KEY_PREFIX}${learnerId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCachedRoadmaps(learnerId, roadmaps) {
  if (!learnerId || !Array.isArray(roadmaps)) return;
  try {
    localStorage.setItem(`${ROADMAPS_CACHE_KEY_PREFIX}${learnerId}`, JSON.stringify(roadmaps));
  } catch {
    // ignore
  }
}

export function upsertCachedRoadmap(learnerId, roadmapItem) {
  if (!learnerId || !roadmapItem || !roadmapItem.id) return;
  try {
    const current = getCachedRoadmaps(learnerId);
    const idx = current.findIndex((r) => r.id === roadmapItem.id || r.roadmap_id === roadmapItem.id);
    let updated;
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = { ...updated[idx], ...roadmapItem };
    } else {
      updated = [roadmapItem, ...current];
    }
    saveCachedRoadmaps(learnerId, updated);
  } catch {
    // ignore
  }
}

const getUserThemeKey = (id) => (id ? `ui_theme_${id}` : "ui_theme_guest");

const LearnerContext = createContext(null);

export function LearnerProvider({ children }) {
  // Session state
  const [learnerId, setLearnerId] = useState(() => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    return saved ? JSON.parse(saved).learnerId : null;
  });
  const [learnerName, setLearnerName] = useState(() => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    return saved ? JSON.parse(saved).learnerName : "";
  });
  const [profileId, setProfileId] = useState(() => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    return saved ? JSON.parse(saved).profileId : null;
  });
  const [roadmapId, setRoadmapId] = useState(() => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    return saved ? JSON.parse(saved).roadmapId : null;
  });

  // User-specific Theme state ('light' | 'dark' | 'system') — default 'light'
  const [theme, setThemeState] = useState(() => {
    const savedSession = localStorage.getItem(SESSION_STORAGE_KEY);
    const id = savedSession ? JSON.parse(savedSession).learnerId : null;
    const key = getUserThemeKey(id);
    return localStorage.getItem(key) || "light";
  });

  // Update theme state when user changes
  useEffect(() => {
    const key = getUserThemeKey(learnerId);
    const userSavedTheme = localStorage.getItem(key) || "light";
    setThemeState(userSavedTheme);
  }, [learnerId]);

  // Apply theme to DOM and persist per-user
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      let isDark = false;
      if (theme === "dark") {
        isDark = true;
      } else if (theme === "light") {
        isDark = false;
      } else {
        isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      }

      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    applyTheme();
    const key = getUserThemeKey(learnerId);
    localStorage.setItem(key, theme);

    if (theme === "system") {
      const media = window.matchMedia("(prefers-color-scheme: dark)");
      const listener = (e) => {
        if (e.matches) root.classList.add("dark");
        else root.classList.remove("dark");
      };
      media.addEventListener("change", listener);
      return () => media.removeEventListener("change", listener);
    }
  }, [theme, learnerId]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
    if (learnerId) {
      updateLearnerTheme(learnerId, newTheme).catch((err) => {
        console.warn("Could not sync theme to Supabase:", err);
      });
    }
  };

  const [profile, setProfile] = useState(null);
  const [profileDraft, setProfileDraft] = useState(null);
  const [pendingRawText, setPendingRawText] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Onboarding draft in localStorage
  const [onboardingDraft, setOnboardingDraftState] = useState(() => {
    try {
      const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
      return draft ? JSON.parse(draft) : null;
    } catch {
      return null;
    }
  });

  // Persist session to localStorage
  useEffect(() => {
    if (learnerId) {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({ learnerId, learnerName, profileId, roadmapId })
      );
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [learnerId, learnerName, profileId, roadmapId]);

  // Load profile and roadmap when ids are available
  useEffect(() => {
    if (profileId && !profile) {
      getProfile(profileId).then((res) => {
        if (res.ok) setProfile(res.data);
      });
    }
  }, [profileId, profile]);

  useEffect(() => {
    if (roadmapId) {
      setLoadingRoadmap(true);
      getRoadmap(roadmapId).then((res) => {
        setLoadingRoadmap(false);
        if (res.ok) {
          setRoadmap(res.data);
          if (!profile && res.data.learner_profile_id) {
            getProfile(res.data.learner_profile_id).then((pRes) => {
              if (pRes.ok) setProfile(pRes.data);
            });
          }
        }
      });
    }
  }, [roadmapId]);

  // Keep local roadmap cache synchronized whenever active roadmap & matching profile are loaded
  useEffect(() => {
    if (
      learnerId &&
      roadmap &&
      roadmap.id &&
      profile &&
      profile.id === (profileId || roadmap.learner_profile_id)
    ) {
      const totalItems = (roadmap.items || []).length;
      const completedItems = (roadmap.items || []).filter(
        (it) => it.status === "completed" || it.status === "skipped"
      ).length;
      const pct = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      const entry = {
        id: roadmap.id,
        roadmap_id: roadmap.id,
        learner_profile_id: profile.id,
        version: roadmap.version || 1,
        goal: profile.target_role || profile.targetRole || profile.goal || "Active Learning Pathway",
        goal_type: profile.goal_type || "job",
        experience_level: profile.experience_level || "intermediate",
        weekly_time_hours: profile.weekly_time_hours || 10,
        timeline_months: profile.timeline_months || 6,
        total_items: totalItems,
        completed_items: completedItems,
        total_hours: (roadmap.items || []).reduce((acc, it) => acc + (it.resource?.duration_hours || 4), 0),
        completed_hours: (roadmap.items || []).filter((it) => it.status === "completed" || it.status === "skipped").reduce((acc, it) => acc + (it.resource?.duration_hours || 4), 0),
        percentage: pct,
        is_completed: totalItems > 0 && completedItems === totalItems,
      };
      upsertCachedRoadmap(learnerId, entry);
    }
  }, [learnerId, roadmap, profile, profileId]);

  const saveOnboardingDraft = (draft) => {
    setOnboardingDraftState(draft);
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  };

  const clearOnboardingDraft = () => {
    setOnboardingDraftState(null);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
  };

  const reloadRoadmap = async (id = roadmapId) => {
    if (!id) return;
    setLoadingRoadmap(true);
    const res = await getRoadmap(id);
    setLoadingRoadmap(false);
    if (res.ok) {
      setRoadmap(res.data);
      setRoadmapId(res.data.id);
    }
    return res;
  };

  const switchRoadmap = async (targetRoadmapId, targetProfileId) => {
    if (!targetRoadmapId) return false;
    setLoadingRoadmap(true);

    const [roadRes, profRes] = await Promise.all([
      getRoadmap(targetRoadmapId),
      targetProfileId ? getProfile(targetProfileId) : Promise.resolve(null),
    ]);

    setLoadingRoadmap(false);

    if (roadRes.ok && roadRes.data) {
      setRoadmap(roadRes.data);
      setRoadmapId(roadRes.data.id);

      const effectiveProfId = targetProfileId || roadRes.data.learner_profile_id;
      setProfileId(effectiveProfId);

      if (profRes?.ok && profRes.data) {
        setProfile(profRes.data);
      } else if (effectiveProfId) {
        const p = await getProfile(effectiveProfId);
        if (p.ok) setProfile(p.data);
      }

      try {
        const currentSession = JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY) || "{}");
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            ...currentSession,
            roadmapId: roadRes.data.id,
            profileId: effectiveProfId,
          })
        );
      } catch {
        // ignore
      }

      return true;
    }
    return false;
  };

  const logout = () => {
    setLearnerId(null);
    setLearnerName("");
    setProfileId(null);
    setRoadmapId(null);
    setProfile(null);
    setProfileDraft(null);
    setRoadmap(null);
    setThemeState("light");
    document.documentElement.classList.remove("dark");
    localStorage.removeItem(SESSION_STORAGE_KEY);
  };

  const value = {
    learnerId,
    setLearnerId,
    learnerName,
    setLearnerName,
    profileId,
    setProfileId,
    profile,
    setProfile,
    profileDraft,
    setProfileDraft,
    pendingRawText,
    setPendingRawText,
    roadmap,
    setRoadmap,
    roadmapId,
    setRoadmapId,
    loadingRoadmap,
    reloadRoadmap,
    switchRoadmap,
    selectedItem,
    setSelectedItem,
    theme,
    setTheme,
    onboardingDraft,
    saveOnboardingDraft,
    clearOnboardingDraft,
    logout,
  };

  return <LearnerContext.Provider value={value}>{children}</LearnerContext.Provider>;
}

export function useLearner() {
  const context = useContext(LearnerContext);
  if (!context) {
    throw new Error("useLearner must be used within a LearnerProvider");
  }
  return context;
}
