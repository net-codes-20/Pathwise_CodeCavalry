import { useNavigate } from "react-router-dom";
import { useLearner } from "../../context/LearnerContext.jsx";
import { deriveLearnerSkills, deriveSkillGaps } from "../../utils/roadmap.js";
import AppShell from "../../components/layout/AppShell.jsx";

export default function SkillsView() {
  const { profile, roadmap } = useLearner();
  const navigate = useNavigate();

  const acquiredSkills = deriveLearnerSkills(profile, roadmap);
  const skillGaps = deriveSkillGaps(profile, roadmap);

  const targetRole = profile?.target_role || profile?.targetRole || profile?.goal || "AI & Software Engineer";

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-route-light dark:bg-route/20 text-route text-xs font-bold uppercase tracking-wider">
              Competency Matrix
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Skills & Gap Analysis
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xl">
              Track acquired proficiencies and priority concepts needed to achieve mastery as a{" "}
              <strong className="text-slate-800 dark:text-slate-200">{targetRole}</strong>.
            </p>
          </div>
        </div>

        {/* Current Skills & Skill Gaps Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Acquired Skills */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Current Acquired Skills</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Mastered via profile & completed coursework</p>
              </div>
              <span className="text-xs font-bold text-route">{acquiredSkills.length} Total</span>
            </div>

            {acquiredSkills.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No skills registered yet.</p>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
                {acquiredSkills.map((skill) => (
                  <div key={skill.name} className="space-y-1.5 p-2.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-800 dark:text-slate-200">{skill.name}</span>
                        {skill.source === "completed_course" && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                            ✓ Coursework
                          </span>
                        )}
                      </div>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">
                        {skill.proficiency} ({skill.pct}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-route rounded-full transition-all duration-500"
                        style={{ width: `${skill.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Priority Skill Gaps */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 space-y-6 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">Priority Skill Gaps</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Remaining competencies to complete your target pathway</p>
                </div>
                <span className="text-xs font-bold text-route dark:text-route-light bg-route/10 dark:bg-route/20 px-2.5 py-1 rounded-full">
                  {skillGaps.length === 0 ? "All Mastered" : `${skillGaps.length} Remaining`}
                </span>
              </div>

              {skillGaps.length === 0 ? (
                <div className="p-6 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-center space-y-3">
                  <span className="text-3xl block">🎉</span>
                  <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300">
                    All Core Competencies Mastered!
                  </h4>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400 max-w-sm mx-auto leading-relaxed">
                    You have covered all target competencies in this roadmap. Ready to set a new goal or level up to advanced specializations?
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/app/new-goal")}
                    className="mt-2 bg-route hover:bg-route-dark text-white text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                  >
                    🚀 Set Next Learning Goal →
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[480px] overflow-y-auto pr-1">
                  {skillGaps.map((gap) => (
                    <div
                      key={gap}
                      className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 font-medium hover:border-route/50 transition-colors"
                    >
                      <span className="text-route dark:text-route-light font-bold">🎯</span>
                      <span className="truncate">{gap}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Target Role Readiness Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 sm:p-8 text-white space-y-4 shadow-xs border border-slate-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-route-light">Target Career Role</span>
              <h3 className="font-display text-xl font-bold mt-0.5">{targetRole}</h3>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full bg-white/10 text-white/90 border border-white/20 font-semibold">
              {skillGaps.length === 0 ? "Pathway Mastered 🏆" : "Curriculum in Progress"}
            </span>
          </div>

          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Your roadmap is designed to transition you from foundational skills to production-grade competencies. Each milestone you complete reduces your skill gaps and strengthens your hands-on portfolio.
          </p>
        </div>
      </div>
    </AppShell>
  );
}
