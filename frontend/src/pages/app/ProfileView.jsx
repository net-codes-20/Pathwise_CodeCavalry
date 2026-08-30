import { useState } from "react";
import { useLearner } from "../../context/LearnerContext.jsx";
import { updateProfile } from "../../api/profile.js";
import AppShell from "../../components/layout/AppShell.jsx";
import Button from "../../components/Button.jsx";
import TagInput from "../../components/TagInput.jsx";
import Toast from "../../components/Toast.jsx";

const LEVELS = ["beginner", "intermediate", "advanced"];

export default function ProfileView() {
  const { profile, profileId, setProfile, learnerName } = useLearner();

  const [editing, setEditing] = useState(false);
  const [goal, setGoal] = useState(profile?.goal || "");
  const [level, setLevel] = useState(profile?.experience_level || "intermediate");
  const [skills, setSkills] = useState(profile?.current_skills || ["Python", "Git", "SQL"]);
  const [interests, setInterests] = useState(profile?.interests || ["AI / Machine Learning"]);
  const [weeklyHours, setWeeklyHours] = useState(profile?.weekly_time_hours || 10);
  const [timelineMonths, setTimelineMonths] = useState(profile?.timeline_months || 6);

  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profileId) {
      setToast({ message: "Profile saved locally.", tone: "info" });
      setEditing(false);
      return;
    }

    setSaving(true);
    const updates = {
      goal,
      experience_level: level,
      current_skills: skills,
      interests,
      weekly_time_hours: Number(weeklyHours),
      timeline_months: Number(timelineMonths),
    };

    const res = await updateProfile(profileId, updates);
    setSaving(false);

    if (res.ok) {
      setProfile((prev) => ({ ...prev, ...updates }));
      setToast({ message: "Profile updated successfully!", tone: "success" });
      setEditing(false);
    } else {
      setToast({ message: "Could not update profile.", tone: "error" });
    }
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block px-3 py-1 rounded-full bg-route-light text-route text-xs font-bold uppercase tracking-wider">
              Learner Profile
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">
              {learnerName || "Learner"}'s Profile
            </h1>
            <p className="text-sm text-slate-500">View and update your personal learning specifications.</p>
          </div>

          <Button
            variant="secondary"
            onClick={() => setEditing(!editing)}
            className="text-xs px-5 py-2.5"
          >
            {editing ? "Cancel Editing" : "✏️ Edit Profile"}
          </Button>
        </div>

        {/* Profile Details or Edit Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          {!editing ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Primary Goal</p>
                  <p className="text-base font-semibold text-slate-900 mt-1">{profile?.goal || goal}</p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Experience Level</p>
                  <span className="inline-block mt-1 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-semibold capitalize">
                    {profile?.experience_level || level}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-100">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.interests || interests).map((i) => (
                      <span
                        key={i}
                        className="bg-route-light/50 text-route text-xs font-semibold px-3 py-1 rounded-full border border-route/20"
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Current Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {(profile?.current_skills || skills).map((s) => (
                      <span
                        key={s}
                        className="bg-slate-100 text-slate-800 text-xs font-medium px-3 py-1 rounded-full border border-slate-200"
                      >
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Study Commitment</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    ⏱️ {profile?.weekly_time_hours || weeklyHours} hours per week
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Timeline</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">
                    📅 {profile?.timeline_months || timelineMonths} months
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Goal Description
                </label>
                <textarea
                  rows={3}
                  className="w-full rounded-2xl border border-slate-200 p-4 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-route/30 focus:border-route"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Experience Level
                  </label>
                  <select
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-route/30 capitalize"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    {LEVELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Weekly Study Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-route/30"
                    value={weeklyHours}
                    onChange={(e) => setWeeklyHours(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Timeline (Months)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-route/30"
                    value={timelineMonths}
                    onChange={(e) => setTimelineMonths(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <TagInput
                  label="Current Skills"
                  values={skills}
                  onChange={setSkills}
                  placeholder="Type a skill and press Enter"
                />
              </div>

              <div>
                <TagInput
                  label="Interests"
                  values={interests}
                  onChange={setInterests}
                  placeholder="Type an interest and press Enter"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving Changes..." : "Save Profile Changes"}
                </Button>
              </div>
            </form>
          )}
        </div>

        <Toast message={toast?.message} tone={toast?.tone} onDismiss={() => setToast(null)} />
      </div>
    </AppShell>
  );
}
