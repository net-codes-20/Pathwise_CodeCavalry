/**
 * Utilities for roadmap state derivation and calculations.
 */

export function calculateProgress(roadmap) {
  if (!roadmap || !roadmap.items || roadmap.items.length === 0) {
    return { total: 0, completed: 0, percentage: 0, remaining: 0, totalHours: 0, completedHours: 0 };
  }

  const items = roadmap.items;
  const total = items.length;
  const completedItems = items.filter((i) => i.status === "completed");
  const skippedItems = items.filter((i) => i.status === "skipped");
  const completed = completedItems.length;
  const finished = completed + skippedItems.length;
  const percentage = Math.round((finished / total) * 100);

  const totalHours = items.reduce((acc, curr) => acc + (curr.resource?.duration_hours || 0), 0);
  const completedHours = completedItems.reduce((acc, curr) => acc + (curr.resource?.duration_hours || 0), 0);

  return {
    total,
    completed,
    skipped: skippedItems.length,
    percentage,
    remaining: Math.max(0, total - finished),
    totalHours,
    completedHours,
    remainingHours: Math.max(0, totalHours - completedHours),
  };
}

export function getStyleInfo(dominantStyle) {
  const normalized = String(dominantStyle || "").toLowerCase();
  if (normalized.includes("vis")) {
    return { id: "visual", label: "Visual", icon: "👁️", desc: "Diagrams, Flowcharts & Spatial Layouts" };
  }
  if (normalized.includes("aur") || normalized.includes("aud")) {
    return { id: "auditory", label: "Aural (Auditory)", icon: "🎧", desc: "Podcasts, Discussions & Verbal Explanations" };
  }
  if (normalized.includes("read") || normalized.includes("write")) {
    return { id: "read_write", label: "Read / Write", icon: "📖", desc: "Documentation, Textbooks & Written Notes" };
  }
  if (normalized.includes("kin") || normalized.includes("hand")) {
    return { id: "kinesthetic", label: "Kinesthetic (Hands-on)", icon: "🛠️", desc: "Live Projects, Coding Labs & Real Practice" };
  }
  return { id: "multimodal", label: "Multimodal", icon: "🌈", desc: "Balanced combination across learning modalities" };
}

export function getWeeklyGoalAndPlan(roadmap, weeklyBudgetHours = 10, targetWeekIndex = null, unlockedWeekMax = 0) {
  if (!roadmap || !roadmap.items || roadmap.items.length === 0) {
    return {
      weekNumber: 1,
      weekIndex: 0,
      effectiveUnlockedMax: 0,
      totalWeeks: 1,
      weeklyBudgetHours,
      assignedItems: [],
      completedItems: [],
      totalWeekHours: 0,
      completedWeekHours: 0,
      isWeekCompleted: false,
      isWeekLocked: false,
      needsUnlockNext: false,
      hasMoreWeeks: false,
      nextWeekNumber: 2,
      allWeeks: [],
    };
  }

  const sorted = [...roadmap.items].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Chunk all items into weeks based on weeklyBudgetHours
  const weeks = [];
  let currentChunk = [];
  let currentHours = 0;

  for (const item of sorted) {
    const itemHours = item.resource?.duration_hours || 4;
    if (currentChunk.length > 0 && currentHours + itemHours > weeklyBudgetHours + 2) {
      weeks.push({
        items: currentChunk,
        totalHours: currentHours,
      });
      currentChunk = [item];
      currentHours = itemHours;
    } else {
      currentChunk.push(item);
      currentHours += itemHours;
    }
  }
  if (currentChunk.length > 0) {
    weeks.push({
      items: currentChunk,
      totalHours: currentHours,
    });
  }

  // 1. Calculate completion state for each week
  let highestCompletedWeekIndex = -1;
  for (let i = 0; i < weeks.length; i++) {
    const isDone = weeks[i].items.length > 0 && weeks[i].items.every((it) => it.status === "completed" || it.status === "skipped");
    weeks[i].isCompleted = isDone;
    weeks[i].weekIndex = i;
    weeks[i].weekNumber = i + 1;
    if (isDone) {
      highestCompletedWeekIndex = i;
    }
  }

  const effectiveUnlockedMax = Math.max(
    Number(unlockedWeekMax) || 0,
    highestCompletedWeekIndex >= 0 ? highestCompletedWeekIndex : 0
  );

  for (let i = 0; i < weeks.length; i++) {
    weeks[i].isLocked = i > effectiveUnlockedMax;
  }

  // Determine active selected week
  let activeWeekIndex = effectiveUnlockedMax;
  if (targetWeekIndex !== null && targetWeekIndex >= 0 && targetWeekIndex < weeks.length) {
    activeWeekIndex = targetWeekIndex;
  }
  activeWeekIndex = Math.min(activeWeekIndex, Math.max(0, weeks.length - 1));

  const activeWeek = weeks[activeWeekIndex] || { items: [], totalHours: 0, isCompleted: false, isLocked: false };
  const isWeekLocked = Boolean(activeWeek.isLocked);
  const assignedItems = (activeWeek.items || []).map((it) => ({
    ...it,
    isLocked: isWeekLocked,
  }));
  const completedItems = assignedItems.filter((it) => it.status === "completed" || it.status === "skipped");
  const totalWeekHours = activeWeek.totalHours;
  const completedWeekHours = completedItems.reduce((acc, curr) => acc + (curr.resource?.duration_hours || 0), 0);
  const isWeekCompleted = assignedItems.length > 0 && completedItems.length === assignedItems.length;
  const hasMoreWeeks = activeWeekIndex < weeks.length - 1;
  const needsUnlockNext = isWeekCompleted && activeWeekIndex === effectiveUnlockedMax && hasMoreWeeks;

  return {
    weekNumber: activeWeekIndex + 1,
    weekIndex: activeWeekIndex,
    effectiveUnlockedMax,
    highestCompletedWeekIndex,
    totalWeeks: Math.max(weeks.length, 1),
    weeklyBudgetHours,
    assignedItems,
    completedItems,
    totalWeekHours,
    completedWeekHours,
    isWeekCompleted,
    isWeekLocked,
    needsUnlockNext,
    hasMoreWeeks,
    nextWeekNumber: activeWeekIndex + 2,
    allWeeks: weeks,
  };
}

export function getTodaysPlan(roadmap) {
  if (!roadmap || !roadmap.items || roadmap.items.length === 0) {
    return [];
  }

  const items = [...roadmap.items].sort((a, b) => (a.order || 0) - (b.order || 0));
  const completedIds = new Set(
    items.filter((i) => i.status === "completed" || i.status === "skipped").map((i) => i.resource?.id || i.id)
  );

  // 1. Find items marked current / in_progress
  const inProgress = items.filter((i) => i.status === "current" || i.status === "in_progress");

  // 2. Find eligible upcoming/not_started items whose prerequisites are completed
  const eligibleUpcoming = items.filter((i) => {
    if (i.status === "completed" || i.status === "skipped" || i.status === "current" || i.status === "in_progress") {
      return false;
    }
    const prereqs = i.resource?.prerequisites || [];
    const allPrereqsDone = prereqs.every((pId) => completedIds.has(pId));
    return allPrereqsDone;
  });

  const candidates = [...inProgress, ...eligibleUpcoming];
  return candidates.slice(0, 3);
}

export function groupRoadmapPhases(roadmap) {
  if (!roadmap || !roadmap.items || roadmap.items.length === 0) {
    return [];
  }

  const items = [...roadmap.items].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Determine phases based on resource level/domain or chunks of items
  const phaseMap = new Map();

  items.forEach((item) => {
    let phaseName = "Foundations";
    const level = item.resource?.level?.toLowerCase();
    const domain = item.resource?.domain?.replace(/_/g, " ") || "";

    if (item.milestone && item.order > items.length * 0.75) {
      phaseName = "Capstone & Mastery";
    } else if (level === "advanced") {
      phaseName = domain ? `Advanced ${domain.toUpperCase()}` : "Advanced Topics";
    } else if (level === "intermediate") {
      phaseName = domain ? `Core ${domain.toUpperCase()}` : "Core Concepts";
    } else {
      phaseName = domain ? `Foundations in ${domain.toUpperCase()}` : "Foundations";
    }

    if (!phaseMap.has(phaseName)) {
      phaseMap.set(phaseName, []);
    }
    phaseMap.get(phaseName).push(item);
  });

  return Array.from(phaseMap.entries()).map(([name, phaseItems], index) => ({
    id: `phase-${index + 1}`,
    name,
    items: phaseItems,
    isCompleted: phaseItems.every((i) => i.status === "completed" || i.status === "skipped"),
    hasCurrent: phaseItems.some((i) => i.status === "current" || i.status === "in_progress"),
  }));
}

const PROFICIENCY_PERCENT = {
  Beginner: 45,
  Basic: 55,
  Competent: 65,
  Intermediate: 75,
  Proficient: 85,
  Advanced: 90,
  Mastered: 95,
  Expert: 100,
};

const IGNORED_TAGS = new Set([
  "roadmap",
  "intro",
  "assessment",
  "fundamentals",
  "basics",
  "overview",
  "guide",
  "tutorial",
  "course",
  "video",
  "practice",
  "project",
  "hands-on",
  "beginner",
  "intermediate",
  "advanced",
  "article",
  "documentation",
  "curriculum",
  "path",
  "summary",
  "test",
  "quiz",
  "tools",
  "layout",
  "responsive",
  "web development",
  "web",
  "html",
  "css",
  "workflow",
  "es6",
  "async",
  "promises",
]);

function formatSkillName(tag) {
  if (!tag) return "";
  const cleaned = tag.replace(/[-_]/g, " ").trim();
  const lower = cleaned.toLowerCase();
  if (lower === "ai ml" || lower === "ai/ml") return "AI & Machine Learning";
  if (lower === "ml") return "Machine Learning";
  if (lower === "dl") return "Deep Learning";
  if (lower === "nlp") return "Natural Language Processing";
  if (lower === "sql") return "SQL";
  if (lower === "api" || lower === "apis") return "API Design & Integration";
  if (lower === "http" || lower === "https") return "HTTP & REST Architecture";
  if (lower === "version control" || lower === "git") return "Version Control & Git";
  if (lower === "data science") return "Data Science & Analytics";
  if (lower === "numpy") return "NumPy (Numerical Computing)";
  if (lower === "pandas") return "Pandas (Data Analysis)";
  if (lower === "typescript") return "TypeScript";
  if (lower === "javascript") return "JavaScript";
  if (lower === "python") return "Python";
  if (lower === "pytorch") return "PyTorch";
  if (lower === "tensorflow") return "TensorFlow";
  if (lower === "linear algebra") return "Linear Algebra for ML";
  if (lower === "probability" || lower === "statistics") return "Probability & Statistics";
  if (lower === "neural networks") return "Neural Networks";
  
  // Title Case
  return cleaned
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function deriveLearnerSkills(profile, roadmap) {
  const skillsMap = new Map();

  // 1. Initial profile skills
  const rawSkills = profile?.raw_skills || [];
  (profile?.current_skills || []).forEach((skillName) => {
    const raw = rawSkills.find((r) => r.name?.toLowerCase() === skillName.toLowerCase());
    const proficiency = raw?.proficiency || "Intermediate";
    const pct = PROFICIENCY_PERCENT[proficiency] || 75;
    const formatted = formatSkillName(skillName);
    skillsMap.set(formatted.toLowerCase(), {
      name: formatted,
      proficiency,
      pct,
      source: "profile",
    });
  });

  // 2. Add skills learned from completed roadmap items
  if (roadmap?.items) {
    roadmap.items.forEach((item) => {
      if (item.status === "completed") {
        const itemLevel = (item.resource?.level || "intermediate").toLowerCase();
        let proficiency = "Competent";
        let pct = 65;

        if (itemLevel === "advanced" || item.milestone) {
          proficiency = "Mastered";
          pct = 90;
        } else if (itemLevel === "intermediate") {
          proficiency = "Proficient";
          pct = 80;
        }

        const tags = [...(item.resource?.tags || [])];
        if (item.resource?.domain) tags.push(item.resource.domain);

        tags.forEach((tag) => {
          const raw = tag.toLowerCase().trim();
          if (!IGNORED_TAGS.has(raw)) {
            const formatted = formatSkillName(tag);
            const key = formatted.toLowerCase();

            if (skillsMap.has(key)) {
              const existing = skillsMap.get(key);
              if (pct > existing.pct) {
                skillsMap.set(key, {
                  name: formatted,
                  proficiency,
                  pct,
                  source: "completed_course",
                });
              }
            } else {
              skillsMap.set(key, {
                name: formatted,
                proficiency,
                pct,
                source: "completed_course",
              });
            }
          }
        });
      }
    });
  }

  // Return sorted by proficiency
  return Array.from(skillsMap.values()).sort((a, b) => b.pct - a.pct);
}

export function deriveSkillGaps(profile, roadmap) {
  const acquiredSkills = deriveLearnerSkills(profile, roadmap);
  const acquiredSkillKeys = new Set(acquiredSkills.map((s) => s.name.toLowerCase()));

  const gapSkillsMap = new Map();

  if (roadmap?.items) {
    // Only inspect UNCOMPLETED items (current / upcoming)
    roadmap.items.forEach((item) => {
      if (item.status !== "completed" && item.status !== "skipped") {
        const tags = [...(item.resource?.tags || [])];
        if (item.resource?.domain) tags.push(item.resource.domain);

        tags.forEach((tag) => {
          const raw = tag.toLowerCase().trim();
          if (!IGNORED_TAGS.has(raw)) {
            const formatted = formatSkillName(tag);
            const key = formatted.toLowerCase();

            if (!acquiredSkillKeys.has(key) && !gapSkillsMap.has(key)) {
              gapSkillsMap.set(key, formatted);
            }
          }
        });
      }
    });
  }

  return Array.from(gapSkillsMap.values());
}
