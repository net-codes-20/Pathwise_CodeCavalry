import { useState, useMemo } from "react";
import { searchCatalog } from "../../utils/catalog.js";
import AppShell from "../../components/layout/AppShell.jsx";

const TYPE_FILTERS = [
  { id: "all", label: "All Formats" },
  { id: "course", label: "Courses" },
  { id: "video", label: "Videos" },
  { id: "article", label: "Articles" },
  { id: "project", label: "Projects" },
  { id: "assessment", label: "Assessments" },
];

const LEVEL_FILTERS = [
  { id: "all", label: "All Levels" },
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

const DOMAIN_FILTERS = [
  { id: "all", label: "All Topics" },
  { id: "web_development", label: "Web Development" },
  { id: "data_science", label: "Data Science" },
  { id: "ai_ml", label: "AI & ML" },
  { id: "cloud_computing", label: "Cloud" },
  { id: "cybersecurity", label: "Cybersecurity" },
  { id: "devops", label: "DevOps" },
];

const TYPE_ICONS = {
  course: "🎓",
  article: "📄",
  video: "🎥",
  project: "🛠️",
  assessment: "📝",
  book: "📚",
};

export default function ExploreView() {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [selectedDomain, setSelectedDomain] = useState("all");

  const results = useMemo(() => {
    return searchCatalog({
      query,
      type: selectedType,
      level: selectedLevel,
      domain: selectedDomain,
    });
  }, [query, selectedType, selectedLevel, selectedDomain]);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header Search Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div className="space-y-1">
            <span className="inline-block px-3 py-1 rounded-full bg-route-light text-route text-xs font-bold uppercase tracking-wider">
              Resource Catalog
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink">
              Explore Learning Resources
            </h1>
            <p className="text-sm text-slate-500">
              Discover curated courses, projects, and guides across modern software domains.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              className="w-full rounded-2xl border border-slate-300 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-route/30 focus:border-route shadow-xs"
              placeholder="Search by topic, skill, title (e.g. Python, Docker, React, Neural Networks)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="absolute left-4 top-3.5 text-slate-400 text-base">🔍</span>
          </div>

          {/* Filter Pills */}
          <div className="space-y-3 pt-2">
            {/* Format Type */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">Format:</span>
              {TYPE_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setSelectedType(f.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    selectedType === f.id
                      ? "bg-route text-white shadow-xs font-semibold"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Level & Domain */}
            <div className="flex items-center gap-4 flex-wrap pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Level:</span>
                <select
                  className="rounded-xl border border-slate-200 px-3 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-route/30"
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(e.target.value)}
                >
                  {LEVEL_FILTERS.map((lvl) => (
                    <option key={lvl.id} value={lvl.id}>
                      {lvl.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Domain:</span>
                <select
                  className="rounded-xl border border-slate-200 px-3 py-1 text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-route/30"
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                >
                  {DOMAIN_FILTERS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {(query || selectedType !== "all" || selectedLevel !== "all" || selectedDomain !== "all") && (
                <button
                  onClick={() => {
                    setQuery("");
                    setSelectedType("all");
                    setSelectedLevel("all");
                    setSelectedDomain("all");
                  }}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Results Counter */}
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Found <strong className="text-slate-800 font-semibold">{results.length}</strong> resources
          </span>
        </div>

        {/* Resource Cards Grid */}
        {results.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
            <span className="text-4xl">📚</span>
            <h3 className="font-bold text-lg text-slate-800">No matching resources found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search terms or relaxing domain and format filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {results.map((res) => (
              <div
                key={res.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-all hover:-translate-y-0.5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {TYPE_ICONS[res.type] || "📄"} {res.type}
                    </span>
                    <span className="text-xs text-slate-400 font-medium capitalize">
                      {res.level} · ⏱️ {res.duration_hours}h
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                    {res.title}
                  </h3>

                  <p className="text-xs text-slate-500 leading-relaxed line-clamp-3">
                    {res.description}
                  </p>

                  <div className="flex flex-wrap gap-1 pt-1">
                    {(res.tags || []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] bg-route-light/40 text-route font-medium px-2 py-0.5 rounded-md"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 capitalize">
                    {res.domain?.replace(/_/g, " ")}
                  </span>

                  {res.url ? (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-route hover:bg-route-light px-3 py-1.5 rounded-xl border border-route/20 transition-colors inline-flex items-center gap-1"
                    >
                      Open Resource ↗
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">In Catalog</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
