import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLearner } from "../context/LearnerContext.jsx";
import { scoreVark } from "../api/vark.js";
import Button from "../components/Button.jsx";
import StepIndicator from "../components/StepIndicator.jsx";

const STYLE_META = {
  visual:      { icon: "🎨", color: "border-blue-300 bg-blue-50 text-blue-800",   selected: "border-blue-500 bg-blue-100 ring-2 ring-blue-300" },
  auditory:    { icon: "🔉", color: "border-purple-300 bg-purple-50 text-purple-800", selected: "border-purple-500 bg-purple-100 ring-2 ring-purple-300" },
  read_write:  { icon: "📚", color: "border-amber-300 bg-amber-50 text-amber-800",  selected: "border-amber-500 bg-amber-100 ring-2 ring-amber-300" },
  kinesthetic: { icon: "🛠️", color: "border-green-300 bg-green-50 text-green-800",  selected: "border-green-500 bg-green-100 ring-2 ring-green-300" },
};

const QUESTIONS = [
  {
    id: "q1",
    text: "How do you prefer to learn something new?",
    options: [
      { style: "visual",      text: "Watching videos, diagrams, or slides" },
      { style: "auditory",    text: "Listening to podcasts or discussions" },
      { style: "read_write",  text: "Reading articles, books, or docs" },
      { style: "kinesthetic", text: "Hands-on: coding, building, experimenting" },
    ],
  },
  {
    id: "q2",
    text: "When you get stuck, your first instinct is to:",
    options: [
      { style: "visual",      text: "Search for a diagram or video walkthrough" },
      { style: "auditory",    text: "Ask a friend to explain it verbally" },
      { style: "read_write",  text: "Read the docs or StackOverflow threads" },
      { style: "kinesthetic", text: "Experiment by changing parts of the code" },
    ],
  },
  {
    id: "q3",
    text: "Which keeps you engaged the longest?",
    options: [
      { style: "visual",      text: "Visual maps, infographics, or video series" },
      { style: "auditory",    text: "Podcasts, talks, or group lectures" },
      { style: "read_write",  text: "Well-structured written guides or docs" },
      { style: "kinesthetic", text: "Coding challenges or mini-app projects" },
    ],
  },
  {
    id: "q4",
    text: "How do you best remember technical concepts?",
    options: [
      { style: "visual",      text: "Associating them with diagrams or colour codes" },
      { style: "auditory",    text: "Repeating them aloud or discussing them" },
      { style: "read_write",  text: "Writing notes or reading them multiple times" },
      { style: "kinesthetic", text: "Using them in a real project or exercise" },
    ],
  },
  {
    id: "q5",
    text: "At a tech workshop, you would most enjoy:",
    options: [
      { style: "visual",      text: "Viewing well-designed slides and demos" },
      { style: "auditory",    text: "Listening to experts share stories and tips" },
      { style: "read_write",  text: "Reading handout guides and cheat sheets" },
      { style: "kinesthetic", text: "Live-coding labs and guided challenges" },
    ],
  },
];

const STEP_LABELS = ["Your Goal", "Learning Style", "Review", "Roadmap"];

export default function VarkAssessment() {
  const { learnerId, setProfileDraft, learnerName } = useLearner();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const currentQuestion = QUESTIONS[currentIndex];
  const isAnswered = !!answers[currentQuestion.id];
  const progressPercent = Math.round(((currentIndex + (isAnswered ? 1 : 0)) / QUESTIONS.length) * 100);

  function handleSelect(style) {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: style }));
  }

  function handleNext() {
    if (currentIndex < QUESTIONS.length - 1) setCurrentIndex((i) => i + 1);
  }

  function handleBack() {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }

  async function handleSubmit() {
    if (Object.keys(answers).length < QUESTIONS.length) {
      setError("Please answer all questions before submitting.");
      return;
    }
    setLoading(true);
    setError(null);

    const answersList = Object.entries(answers).map(([qId, style]) => ({
      question_id: qId,
      selected_option: style,
    }));

    const res = await scoreVark(learnerId, answersList);
    setLoading(false);

    if (!res.ok) {
      setError("Failed to score your assessment. Please try again.");
      return;
    }

    setProfileDraft((prev) => ({
      ...(prev || {}),
      learning_style: res.data.learning_style,
    }));

    navigate("/profile/review");
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-spin">⚙️</div>
          <p className="text-slate-600 font-medium">Analysing your learning style...</p>
        </div>
      </div>
    );
  }

  const selectedStyle = answers[currentQuestion.id];

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <div className="border-b border-slate-200 bg-white px-6 py-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-route">✶ Pathwise</span>
        {learnerName && (
          <span className="text-xs text-slate-500">Hello, <strong>{learnerName}</strong></span>
        )}
      </div>

      <div className="flex-1 flex items-start justify-center px-6 py-10">
        <div className="w-full max-w-xl">
          <div className="mb-8">
            <StepIndicator current={2} total={4} labels={STEP_LABELS} />
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-route mb-0.5">
                  Learning Style Assessment
                </p>
                <p className="text-slate-500 text-xs">
                  Question {currentIndex + 1} of {QUESTIONS.length}
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-400">{progressPercent}%</span>
            </div>

            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-7">
              <div
                className="h-full bg-gradient-to-r from-route to-[#4a9b82] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <h2 className="font-display text-xl text-slate-800 font-semibold mb-6 leading-snug">
              {currentQuestion.text}
            </h2>

            <div className="grid grid-cols-1 gap-3">
              {currentQuestion.options.map((option, idx) => {
                const meta = STYLE_META[option.style];
                const isSelected = selectedStyle === option.style;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(option.style)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-150 focus:outline-none ${
                      isSelected ? meta.selected : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all ${
                          isSelected ? "scale-110" : ""
                        }`}
                      >
                        {meta.icon}
                      </span>
                      <div className="flex-1">
                        <p className={`text-sm font-medium leading-snug ${isSelected ? "text-slate-900" : "text-slate-700"}`}>
                          {option.text}
                        </p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected ? "border-current bg-current" : "border-slate-300"
                        }`}
                      >
                        {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-3 py-2.5 text-sm text-red-700 flex gap-2">
                <span>⚠</span> {error}
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <Button
                variant="secondary"
                onClick={handleBack}
                disabled={currentIndex === 0}
                className="px-5"
              >
                ← Back
              </Button>

              {currentIndex === QUESTIONS.length - 1 ? (
                <Button onClick={handleSubmit} disabled={!isAnswered} className="flex-1">
                  See My Learning Style →
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!isAnswered} className="flex-1">
                  Next Question →
                </Button>
              )}
            </div>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            {Object.keys(answers).length} of {QUESTIONS.length} questions answered
          </p>
        </div>
      </div>
    </div>
  );
}