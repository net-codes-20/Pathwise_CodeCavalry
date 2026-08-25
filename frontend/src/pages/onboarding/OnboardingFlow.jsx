import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLearner } from "../../context/LearnerContext.jsx";
import { parseProfile } from "../../api/profile.js";
import { scoreVark } from "../../api/vark.js";
import Button from "../../components/Button.jsx";

const INTEREST_OPTIONS = [
  { id: "ai_ml", label: "AI / Machine Learning", icon: "🤖" },
  { id: "web_dev", label: "Web Development", icon: "🌐" },
  { id: "data_science", label: "Data Science", icon: "📊" },
  { id: "cloud", label: "Cloud Computing", icon: "☁️" },
  { id: "cybersecurity", label: "Cybersecurity", icon: "🔒" },
  { id: "mobile_dev", label: "Mobile Development", icon: "📱" },
  { id: "iot", label: "IoT / Embedded Systems", icon: "⚡" },
  { id: "devops", label: "DevOps & CI/CD", icon: "🔄" },
  { id: "game_dev", label: "Game Development", icon: "🎮" },
  { id: "swe", label: "Software Engineering", icon: "💻" },
];

const TIMELINE_OPTIONS = [
  { value: 1, label: "1 Month", desc: "Intensive Sprint" },
  { value: 3, label: "3 Months", desc: "Fast Track" },
  { value: 6, label: "6 Months", desc: "Balanced Pace" },
  { value: 12, label: "12 Months", desc: "Deep Mastery" },
];

const DAILY_TIME_HOURS = {
  "30 min": 0.5,
  "1 hour": 1.0,
  "2 hours": 2.0,
  "3 hours": 3.0,
  "3+ hours": 4.0,
};

const LEARNER_TYPES = [
  "Student",
  "Working Professional",
  "Job Seeker",
  "Career Switcher",
  "Other",
];

const GOAL_TYPES = [
  { id: "job", label: "Land a Full-Time Job", desc: "Industry roles & requirements", icon: "💼" },
  { id: "internship", label: "Secure an Internship", desc: "Student & entry-level projects", icon: "🎯" },
  { id: "career_transition", label: "Career Switch", desc: "Transitioning into tech & AI", icon: "🔄" },
  { id: "new_skill", label: "Learn a New Skill", desc: "Frameworks, AI tools & stacks", icon: "🚀" },
  { id: "project", label: "Build a Real Project", desc: "Portfolio development from 0 to 1", icon: "🛠️" },
  { id: "academic", label: "Academic / Research", desc: "Thesis, papers & deep concepts", icon: "🔬" },
  { id: "certification", label: "Certification Prep", desc: "Pass professional exams", icon: "📜" },
  { id: "interview_prep", label: "Interview Prep", desc: "Coding tests & system design", icon: "⚡" },
];

const TARGET_ROLE_OPTIONS_BY_GOAL_TYPE = {
  job: {
    label: "Target Role / Job Title",
    placeholder: "Select or type your target job role...",
    options: [
      "AI Engineer (LLMs & Agents)",
      "Machine Learning Engineer",
      "Data Scientist / Analytics Specialist",
      "Fullstack Developer (React & Node/Python)",
      "Backend Engineer (APIs & Microservices)",
      "Frontend Engineer (TypeScript & Next.js)",
      "Cloud & DevOps Engineer",
      "Software Engineer (Generalist)",
      "Other",
    ],
  },
  internship: {
    label: "Target Internship Role",
    placeholder: "Select or type your desired internship position...",
    options: [
      "AI / ML Research Intern",
      "Software Engineering Intern",
      "Data Science Intern",
      "Frontend / Web Development Intern",
      "Backend Development Intern",
      "DevOps & Infrastructure Intern",
      "Computer Vision / NLP Intern",
      "Other",
    ],
  },
  career_transition: {
    label: "Target Transition Field / Role",
    placeholder: "Select or type your target transition pathway...",
    options: [
      "Transition to AI / ML Engineering",
      "Transition to Fullstack Web Development",
      "Transition to Data Science & Analytics",
      "Transition to Cloud & DevOps Engineering",
      "Transition from Non-Tech to Software Engineering",
      "Transition to Technical Product / Solutions Engineering",
      "Other",
    ],
  },
  new_skill: {
    label: "Target Skill / Technology Stack",
    placeholder: "Select or type the skill or framework you want to master...",
    options: [
      "Generative AI, LangChain & LLM Chatbots",
      "Deep Learning & Neural Networks (PyTorch/TensorFlow)",
      "React, Next.js & Modern Frontend Architecture",
      "FastAPI, Python Microservices & Async APIs",
      "Docker, Kubernetes & Containerization",
      "SQL, Data Modeling & PostgreSQL",
      "TypeScript & Scalable Clean Code",
      "Other",
    ],
  },
  project: {
    label: "Project Type / Practical Focus",
    placeholder: "Select or type your portfolio project concept...",
    options: [
      "Autonomous AI Agent / Multi-Agent Workflow",
      "Production RAG (Retrieval-Augmented Generation) System",
      "Fullstack SaaS Web Application with Auth & Payments",
      "End-to-End ML Pipeline with Model Deployment",
      "Real-Time Collaborative Platform",
      "Computer Vision / Image Processing System",
      "Personal Portfolio & Capstone Projects",
      "Other",
    ],
  },
  academic: {
    label: "Research Domain / Academic Topic",
    placeholder: "Select or type your research domain...",
    options: [
      "Natural Language Processing (NLP) & Transformers",
      "Deep Learning & Computer Vision Research",
      "Reinforcement Learning & Autonomous Systems",
      "Statistical Machine Learning & Optimization Theory",
      "AI Ethics, Interpretability & Alignment",
      "Master's / PhD Thesis Preparation",
      "Other",
    ],
  },
  certification: {
    label: "Target Certification",
    placeholder: "Select or type the specific certification exam...",
    options: [
      "AWS Certified Machine Learning - Specialty",
      "AWS Certified Solutions Architect / Cloud Practitioner",
      "Google Cloud Professional Machine Learning Engineer",
      "Google Cloud Professional Data Engineer",
      "Microsoft Certified: Azure AI Engineer Associate",
      "TensorFlow Developer Certificate",
      "Meta Frontend / Backend Professional Certificate",
      "CKA (Certified Kubernetes Administrator)",
      "Other",
    ],
  },
  interview_prep: {
    label: "Interview Preparation Track",
    placeholder: "Select or type your target interview focus...",
    options: [
      "Data Structures, Algorithms & LeetCode (Python/Java/JS)",
      "System Design & High-Scalability Architecture",
      "Machine Learning & AI Technical Screen Prep",
      "Fullstack & Backend Coding Interviews",
      "Behavioral & Engineering Leadership Rounds",
      "Other",
    ],
  },
};

const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "Beginner", desc: "Starting from scratch", icon: "🌱" },
  { id: "intermediate", label: "Intermediate", desc: "Have basic fundamentals", icon: "🚀" },
  { id: "advanced", label: "Advanced", desc: "Experienced, seeking mastery", icon: "⭐" },
];

const PROFICIENCY_LEVELS = ["Beginner", "Basic", "Intermediate", "Advanced", "Expert"];

const VARK_QUESTIONS = [
  {
    id: "q1",
    question: "You need to give directions to a friend who wants to visit your house. You would:",
    options: [
      { style: "visual", label: "Draw a map or give them a visual map layout" },
      { style: "auditory", label: "Tell them the directions over a phone call" },
      { style: "read_write", label: "Write down step-by-step street instructions" },
      { style: "kinesthetic", label: "Drive or walk with them to show them the route" },
    ],
  },
  {
    id: "q2",
    question: "You want to learn how to assemble a piece of flat-pack furniture. You would:",
    options: [
      { style: "visual", label: "Study the assembly diagrams and schematics" },
      { style: "auditory", label: "Ask a friend or family member to explain the process" },
      { style: "read_write", label: "Read through the step-by-step written text manual" },
      { style: "kinesthetic", label: "Jump straight into fitting the parts together by trial and error" },
    ],
  },
  {
    id: "q3",
    question: "You are planning a vacation for a group of friends. To get feedback on the plan, you would:",
    options: [
      { style: "visual", label: "Show them a visual map and photos of the itinerary" },
      { style: "auditory", label: "Call them or host a meeting to talk it through" },
      { style: "read_write", label: "Send a detailed written email or document summary" },
      { style: "kinesthetic", label: "Plan a mini walkthrough or focus on the physical activities scheduled" },
    ],
  },
  {
    id: "q4",
    question: "You are learning a new software program or digital tool on your computer. You prefer to:",
    options: [
      { style: "visual", label: "Follow flowcharts or UI visual walkthroughs" },
      { style: "auditory", label: "Ask a tech expert or listen to a step-by-step podcast tutorial" },
      { style: "read_write", label: "Read the user documentation or official text manual" },
      { style: "kinesthetic", label: "Dive in immediately and figure it out by clicking around" },
    ],
  },
  {
    id: "q5",
    question: "You are shopping for a new house or apartment. Before visiting, you prefer:",
    options: [
      { style: "visual", label: "A floor plan drawing and map of the neighborhood" },
      { style: "auditory", label: "A discussion with the real estate agent or owner" },
      { style: "read_write", label: "A detailed printed list of features and specifications" },
      { style: "kinesthetic", label: "A video walkthrough showing movement through the space" },
    ],
  },
  {
    id: "q6",
    question: "You have a medical condition (like knee pain) and want to understand it. You'd prefer the doctor:",
    options: [
      { style: "visual", label: "Shows you an anatomical diagram or chart of the joint" },
      { style: "auditory", label: "Verbally explains what is happening in detail" },
      { style: "read_write", label: "Gives you a medical brochure or pamphlet to read" },
      { style: "kinesthetic", label: "Uses a 3D physical model to demonstrate the issue" },
    ],
  },
  {
    id: "q7",
    question: "You want to learn how to play a new board game or card game. You would:",
    options: [
      { style: "visual", label: "Look at diagrams of game setup and board layouts" },
      { style: "auditory", label: "Have someone explain the rules aloud and answer questions" },
      { style: "read_write", label: "Read the instruction booklet from start to finish" },
      { style: "kinesthetic", label: "Start playing a practice round immediately to learn by doing" },
    ],
  },
  {
    id: "q8",
    question: "When choosing a field of study or career path, you prioritize:",
    options: [
      { style: "visual", label: "Working with designs, layouts, maps, or charts" },
      { style: "auditory", label: "Communicating and exchanging ideas through discussions" },
      { style: "read_write", label: "Working with text, reports, and written information" },
      { style: "kinesthetic", label: "Applying practical skills in real-world, hands-on scenarios" },
    ],
  },
  {
    id: "q9",
    question: "You want to improve your photography skills. You would:",
    options: [
      { style: "visual", label: "Examine diagrams showing camera mechanics and settings" },
      { style: "auditory", label: "Talk with an experienced photographer and ask questions" },
      { style: "read_write", label: "Read the camera instructions and written guidebooks" },
      { style: "kinesthetic", label: "Take photos, adjust settings, and evaluate real test shots" },
    ],
  },
  {
    id: "q10",
    question: "A educational website features a tutorial with multiple components. You learn best from:",
    options: [
      { style: "visual", label: "Infographics, diagrams, and graphic charts" },
      { style: "auditory", label: "Audio narration and spoken explanations" },
      { style: "read_write", label: "Written articles and transcript lists" },
      { style: "kinesthetic", label: "Interactive demonstrations or step-by-step videos" },
    ],
  },
  {
    id: "q11",
    question: "You need to prepare a group presentation on a historical event. You would prefer to:",
    options: [
      { style: "visual", label: "Design slides heavy on charts, timelines, and visual images" },
      { style: "auditory", label: "Lead the verbal delivery and group speech portions" },
      { style: "read_write", label: "Write the research paper, script, and hand-out notes" },
      { style: "kinesthetic", label: "Create physical props, models, or perform a reenactment" },
    ],
  },
  {
    id: "q12",
    question: "When receiving feedback on a test or work project, you prefer:",
    options: [
      { style: "visual", label: "Visual graphs tracking performance improvements" },
      { style: "auditory", label: "A face-to-face conversation talking through the results" },
      { style: "read_write", label: "A detailed written report or written feedback comments" },
      { style: "kinesthetic", label: "Reviewing concrete examples of what you executed" },
    ],
  },
  {
    id: "q13",
    question: "You are shopping for financial options or bank products. You decide by:",
    options: [
      { style: "visual", label: "Comparing visual graphs showing interest over time" },
      { style: "auditory", label: "Discussing choices with a financial consultant" },
      { style: "read_write", label: "Reading printed brochures and terms in detail" },
      { style: "kinesthetic", label: "Using an interactive calculator to input custom numbers" },
    ],
  },
  {
    id: "q14",
    question: "You are selecting a instructor, teacher, or conference speaker. You prefer someone who uses:",
    options: [
      { style: "visual", label: "Diagrams, flowcharts, and slide visuals" },
      { style: "auditory", label: "Group discussions, Q&As, and conversational lectures" },
      { style: "read_write", label: "Comprehensive handouts, books, and assigned readings" },
      { style: "kinesthetic", label: "Hands-on experiments, practical models, and demonstrations" },
    ],
  },
  {
    id: "q15",
    question: "You are trying to learn a new workout routine or physical exercise. You prefer to:",
    options: [
      { style: "visual", label: "Study posture diagrams and alignment illustrations" },
      { style: "auditory", label: "Listen to a trainer explain the movement cues" },
      { style: "read_write", label: "Read a bulleted list of physical steps to follow" },
      { style: "kinesthetic", label: "Perform the movement slowly while watching a video demonstration" },
    ],
  },
  {
    id: "q16",
    question: "When browsing the internet to understand a new subject, you gravitate toward:",
    options: [
      { style: "visual", label: "Visually compelling layouts, infographics, and mind maps" },
      { style: "auditory", label: "Podcasts, radio interviews, and audio clips" },
      { style: "read_write", label: "In-depth written articles, e-books, and blogs" },
      { style: "kinesthetic", label: "Hands-on simulation tools and practical video tutorials" },
    ],
  },
  {
    id: "q17",
    question: "You need to remember a set of technical terms or vocabulary. You choose to:",
    options: [
      { style: "visual", label: "Use color-coded mind maps or flashcards with visual icons" },
      { style: "auditory", label: "Repeat the terms aloud or discuss them with a study buddy" },
      { style: "read_write", label: "Write definitions out repeatedly in a study journal" },
      { style: "kinesthetic", label: "Associate terms with physical movements or real-world objects" },
    ],
  },
  {
    id: "q18",
    question: "You are tasked with researching the history of your local city. You would:",
    options: [
      { style: "visual", label: "Gather and compare old maps, photos, and historical blueprints" },
      { style: "auditory", label: "Record oral history interviews from longtime residents" },
      { style: "read_write", label: "Read old newspaper articles and archived town documents" },
      { style: "kinesthetic", label: "Visit local historical sites and examine artifacts directly" },
    ],
  },
  {
    id: "q19",
    question: "You are trouble-shooting a malfunctioning household appliance. You would:",
    options: [
      { style: "visual", label: "Look at a visual diagram of the machine’s internal wiring" },
      { style: "auditory", label: "Call customer support to talk through the issue with a technician" },
      { style: "read_write", label: "Read the troubleshooting section of the printed user guide" },
      { style: "kinesthetic", label: "Open the machine up and test the components directly" },
    ],
  },
  {
    id: "q20",
    question: "When reflecting on your overall learning style, you feel most engaged when:",
    options: [
      { style: "visual", label: "Content is represented in spatial, structured, or visual form" },
      { style: "auditory", label: "Concepts are debated and talked through aloud" },
      { style: "read_write", label: "Concepts are defined clearly using precise text and words" },
      { style: "kinesthetic", label: "Knowledge is applied through real-life context and practice" },
    ],
  },
];

const DAYS_OF_WEEK = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAILY_TIME_OPTIONS = ["30 min", "1 hour", "2 hours", "3 hours", "3+ hours"];

export default function OnboardingFlow() {
  const { learnerId, learnerName, onboardingDraft, saveOnboardingDraft, setProfileDraft } = useLearner();
  const navigate = useNavigate();

  const [step, setStep] = useState(onboardingDraft?.step || 1);
  const [error, setError] = useState(null);
  const [parsingGoal, setParsingGoal] = useState(false);
  const [scoringVark, setScoringVark] = useState(false);

  // Form State
  const [name, setName] = useState(onboardingDraft?.name || learnerName || "");
  const [learnerType, setLearnerType] = useState(onboardingDraft?.learnerType || "");
  const [goalType, setGoalType] = useState(onboardingDraft?.goalType || "");
  const [experienceLevel, setExperienceLevel] = useState(onboardingDraft?.experienceLevel || "");
  const [interests, setInterests] = useState(onboardingDraft?.interests || []);
  const [targetRole, setTargetRole] = useState(onboardingDraft?.targetRole || "");
  const [timelineMonths, setTimelineMonths] = useState(onboardingDraft?.timelineMonths || "");
  const [goalText, setGoalText] = useState(onboardingDraft?.goalText || "");
  const [varkAnswers, setVarkAnswers] = useState(onboardingDraft?.varkAnswers || {});
  const [varkQuestionIndex, setVarkQuestionIndex] = useState(() => {
    const answeredCount = Object.keys(onboardingDraft?.varkAnswers || {}).length;
    return Math.min(answeredCount, VARK_QUESTIONS.length - 1);
  });
  const [skills, setSkills] = useState(onboardingDraft?.skills || []);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [newSkillProficiency, setNewSkillProficiency] = useState("Intermediate");
  const [dailyTime, setDailyTime] = useState(onboardingDraft?.dailyTime || "2 hours");
  const [selectedDays, setSelectedDays] = useState(onboardingDraft?.selectedDays || ["Mon", "Tue", "Wed", "Thu", "Fri"]);

  const [isCustomRole, setIsCustomRole] = useState(false);
  const [customRoleText, setCustomRoleText] = useState("");

  const currentRoleConfig = goalType
    ? (TARGET_ROLE_OPTIONS_BY_GOAL_TYPE[goalType] || TARGET_ROLE_OPTIONS_BY_GOAL_TYPE.job)
    : { label: "Target Role / Focus", placeholder: "Select an objective first...", options: [] };

  const handleSelectVarkOption = (questionId, style) => {
    const nextAnswers = { ...varkAnswers, [questionId]: style };
    setVarkAnswers(nextAnswers);

    if (varkQuestionIndex < VARK_QUESTIONS.length - 1) {
      setVarkQuestionIndex((prev) => prev + 1);
    } else {
      setError(null);
      setStep(5);
    }
  };

  // Auto-save draft on changes
  useEffect(() => {
    saveOnboardingDraft({
      step,
      name,
      learnerType,
      goalType,
      experienceLevel,
      interests,
      targetRole,
      timelineMonths,
      goalText,
      varkAnswers,
      skills,
      dailyTime,
      selectedDays,
    });
  }, [step, name, learnerType, goalType, experienceLevel, interests, targetRole, timelineMonths, goalText, varkAnswers, skills, dailyTime, selectedDays]);

  const handleInterestToggle = (id) => {
    if (interests.includes(id)) {
      setInterests(interests.filter((i) => i !== id));
    } else {
      setInterests([...interests, id]);
    }
  };

  const handleAddSkill = (e) => {
    e?.preventDefault();
    if (!newSkillInput.trim()) return;
    if (skills.some((s) => s.name.toLowerCase() === newSkillInput.trim().toLowerCase())) return;
    setSkills([...skills, { name: newSkillInput.trim(), proficiency: newSkillProficiency }]);
    setNewSkillInput("");
  };

  const handleRemoveSkill = (skillName) => {
    setSkills(skills.filter((s) => s.name !== skillName));
  };

  const handleDayToggle = (day) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleNext = async () => {
    setError(null);

    // Step 1 validation
    if (step === 1) {
      if (!name.trim()) {
        setError("Please enter your name.");
        return;
      }
      if (!learnerType) {
        setError("Please select your current learner type.");
        return;
      }
      if (!experienceLevel) {
        setError("Please select your overall tech experience level.");
        return;
      }
      setStep(2);
      return;
    }

    // Step 2 validation
    if (step === 2) {
      if (interests.length === 0) {
        setError("Please select at least one interest domain.");
        return;
      }
      setStep(3);
      return;
    }

    // Step 3: Goal & Natural Language Parse
    if (step === 3) {
      if (!goalType) {
        setError("Please select your primary goal objective.");
        return;
      }
      const effectiveRole = isCustomRole ? customRoleText.trim() : targetRole;
      if (!effectiveRole) {
        setError(`Please select or enter your ${currentRoleConfig.label || "target focus"}.`);
        return;
      }
      if (!timelineMonths || Number(timelineMonths) < 1) {
        setError("Please enter your target timeline in months.");
        return;
      }
      if (!goalText.trim()) {
        setError("Please describe your learning goal in detail.");
        return;
      }
      if (learnerId) {
        setParsingGoal(true);
        const parseRes = await parseProfile(learnerId, goalText);
        setParsingGoal(false);
        if (parseRes.ok && parseRes.data?.profile) {
          // If backend parsed specific fields, merge them
          if (parseRes.data.profile.timeline_months && !timelineMonths) {
            setTimelineMonths(parseRes.data.profile.timeline_months);
          }
        }
      }
      setStep(4);
      return;
    }

    // Step 4: VARK Assessment
    if (step === 4) {
      if (Object.keys(varkAnswers).length < VARK_QUESTIONS.length) {
        setError("Please answer all questions to determine your learning preference.");
        return;
      }
      setStep(5);
      return;
    }

    // Step 5: Skills
    if (step === 5) {
      setStep(6);
      return;
    }

    // Step 6: Availability & Finish
    if (step === 6) {
      if (selectedDays.length === 0) {
        setError("Please select at least one study day.");
        return;
      }

      // Convert daily time and selected days to weekly hours
      const dailyHours = DAILY_TIME_HOURS[dailyTime] || 2.0;
      const weeklyHours = Math.max(1, Math.round(dailyHours * selectedDays.length * 10) / 10);

      // Score VARK
      setScoringVark(true);
      let calculatedStyle = {
        dominant_style: "kinesthetic",
        scores: { visual: 25, auditory: 25, read_write: 25, kinesthetic: 25 },
      };

      if (learnerId && Object.keys(varkAnswers).length > 0) {
        const answersList = Object.entries(varkAnswers).map(([qId, style]) => ({
          question_id: qId,
          selected_option: style,
        }));
        const scoreRes = await scoreVark(learnerId, answersList);
        if (scoreRes.ok && scoreRes.data?.learning_style) {
          calculatedStyle = scoreRes.data.learning_style;
        }
      }
      setScoringVark(false);

      const effectiveRoleName = isCustomRole && customRoleText.trim()
        ? customRoleText.trim()
        : (targetRole || "AI Engineer");

      // Build complete profile draft object with clean role as goal
      const fullProfile = {
        goal: effectiveRoleName,
        goal_type: goalType || "job",
        experience_level: experienceLevel,
        current_skills: skills.map((s) => s.name),
        interests: interests.map((i) => {
          const item = INTEREST_OPTIONS.find((opt) => opt.id === i);
          return item ? item.label : i;
        }),
        timeline_months: Number(timelineMonths) || 6,
        weekly_time_hours: weeklyHours,
        constraints: [`Study days: ${selectedDays.join(", ")}`, `Daily commitment: ${dailyTime}`],
        learning_style: calculatedStyle,
        raw_skills: skills,
        target_role: effectiveRoleName,
        goal_description: goalText ? goalText.trim() : "",
      };

      setProfileDraft(fullProfile);
      navigate("/onboarding/analyzing", { state: { profile: fullProfile } });
    }
  };

  const handleBack = () => {
    setError(null);
    if (step > 1 && step !== 4) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col font-body">
      {/* Onboarding Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl text-route font-bold">✶</span>
          <span className="font-display font-bold text-lg text-ink">Pathwise</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-slate-500">
            Step <strong className="text-slate-800">{step}</strong> of 6
          </span>
          <div className="w-24 sm:w-36 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-route rounded-full transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-10">
          {/* STEP 1: Basic Profile */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-route">Step 1</span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">Tell us about yourself</h2>
                <p className="text-sm text-slate-500 mt-1">Let's set up your core learner profile.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-route/30 focus:border-route"
                    placeholder="e.g. Alex Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Current Learner Type
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {LEARNER_TYPES.map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setLearnerType(type)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                          learnerType === type
                            ? "border-route bg-route text-white shadow-xs"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                    Overall Tech Experience
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {EXPERIENCE_LEVELS.map((lvl) => (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => setExperienceLevel(lvl.id)}
                        className={`p-4 rounded-xl border text-left transition-all ${
                          experienceLevel === lvl.id
                            ? "border-route bg-route-light/40 ring-2 ring-route/20"
                            : "border-slate-200 bg-white hover:border-slate-300"
                        }`}
                      >
                        <span className="text-xl mb-1 block">{lvl.icon}</span>
                        <p className="font-semibold text-sm text-slate-800">{lvl.label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{lvl.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Interests */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-route">Step 2</span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">What are your interests?</h2>
                <p className="text-sm text-slate-500 mt-1">Select domains you want to explore or specialize in.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {INTEREST_OPTIONS.map((item) => {
                  const selected = interests.includes(item.id);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleInterestToggle(item.id)}
                      className={`p-3.5 rounded-xl border flex items-center justify-between transition-all ${
                        selected
                          ? "border-route bg-route-light/40 text-slate-900 font-semibold ring-2 ring-route/20"
                          : "border-slate-200 hover:border-slate-300 text-slate-700 bg-white"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{item.icon}</span>
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <span className={`text-xs ${selected ? "text-route font-bold" : "text-slate-300"}`}>
                        {selected ? "✓" : "+"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Goal & Objective */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-route">Step 3</span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink dark:text-white mt-1">Define your learning objective & goal</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Tell us your primary intent, target role, and timeline.</p>
              </div>

              <div className="space-y-5">
                {/* Goal Objective / Intent */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-2">
                    Primary Goal Objective
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {GOAL_TYPES.map((gt) => {
                      const isSelected = goalType === gt.id;
                      return (
                        <button
                          key={gt.id}
                          type="button"
                          onClick={() => {
                            setGoalType(gt.id);
                            setTargetRole("");
                            setIsCustomRole(false);
                            setCustomRoleText("");
                          }}
                          className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                            isSelected
                              ? "border-route bg-route-light/40 dark:bg-route/15 text-route ring-2 ring-route/20 shadow-xs font-semibold"
                              : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div>
                            <div className="text-xl mb-1">{gt.icon}</div>
                            <p className="text-xs font-bold leading-tight">{gt.label}</p>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-tight">{gt.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      {currentRoleConfig.label}
                    </label>
                    <select
                      value={isCustomRole ? "Other" : targetRole}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "Other") {
                          setIsCustomRole(true);
                          setTargetRole(customRoleText);
                        } else {
                          setIsCustomRole(false);
                          setTargetRole(val);
                        }
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-ink dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-route/30 focus:border-route cursor-pointer transition-all"
                    >
                      <option value="" disabled>
                        -- Select {currentRoleConfig.label} --
                      </option>
                      {currentRoleConfig.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                      <option value="Other">Other / Custom Focus...</option>
                    </select>

                    {isCustomRole && (
                      <input
                        type="text"
                        autoFocus
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-route/30 focus:border-route animate-in fade-in duration-150 mt-1.5"
                        placeholder={`Type your custom ${currentRoleConfig.label.toLowerCase()}...`}
                        value={customRoleText}
                        onChange={(e) => {
                          setCustomRoleText(e.target.value);
                          setTargetRole(e.target.value);
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                      Target Timeline (Months)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="24"
                      placeholder="e.g. 6"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-route/30 focus:border-route"
                      value={timelineMonths}
                      onChange={(e) => setTimelineMonths(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                    Describe your goal in detail
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 text-sm text-ink dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-route/30 focus:border-route"
                    placeholder="Describe your learning goal, target concepts, and what you hope to achieve..."
                    value={goalText}
                    onChange={(e) => setGoalText(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                    💡 Our AI will analyze your description to extract prerequisite requirements and milestones.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Learning Preferences (VARK) - 1 Question at a time, Forward Only */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold uppercase tracking-widest text-route">Step 4 • VARK Assessment</span>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink dark:text-white mt-1">
                    Question {varkQuestionIndex + 1} of {VARK_QUESTIONS.length}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Select how you would handle this situation. Answers are saved immediately.
                  </p>
                </div>

                <div className="sm:text-right shrink-0 bg-slate-50 dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-bold text-route">
                    {varkQuestionIndex + 1} of {VARK_QUESTIONS.length}
                  </p>
                  <div className="w-36 h-2 bg-slate-200 dark:bg-slate-700 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-route transition-all duration-300 ease-out"
                      style={{ width: `${((varkQuestionIndex + 1) / VARK_QUESTIONS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Single Active Question Card */}
              {VARK_QUESTIONS[varkQuestionIndex] && (
                <div className="p-5 sm:p-7 bg-slate-50/80 dark:bg-slate-800/80 rounded-3xl border border-slate-200/90 dark:border-slate-700/90 space-y-5 shadow-xs">
                  <div className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-route text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      {varkQuestionIndex + 1}
                    </span>
                    <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug">
                      {VARK_QUESTIONS[varkQuestionIndex].question}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 pt-2">
                    {VARK_QUESTIONS[varkQuestionIndex].options.map((opt, optIdx) => (
                      <button
                        key={opt.style}
                        type="button"
                        onClick={() => handleSelectVarkOption(VARK_QUESTIONS[varkQuestionIndex].id, opt.style)}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-left text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 hover:border-route hover:bg-route/5 dark:hover:bg-route/10 hover:text-route transition-all flex items-center justify-between gap-4 group shadow-2xs cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full border border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-400 group-hover:border-route group-hover:text-route flex items-center justify-center shrink-0 transition-colors">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="leading-relaxed">{opt.label}</span>
                        </div>
                        <span className="text-route opacity-0 group-hover:opacity-100 transition-opacity font-bold text-base">
                          →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Existing Skills */}
          {step === 5 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-route">Step 5</span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">Existing Skills</h2>
                <p className="text-sm text-slate-500 mt-1">
                  List skills and programming languages you already have experience with.
                </p>
              </div>

              {/* Add Skill Form */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-route/30 focus:border-route"
                  placeholder="e.g. Python, Docker, SQL"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddSkill();
                    }
                  }}
                />
                <select
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-route/30"
                  value={newSkillProficiency}
                  onChange={(e) => setNewSkillProficiency(e.target.value)}
                >
                  {PROFICIENCY_LEVELS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
                <Button type="button" onClick={handleAddSkill} className="px-5 py-2.5 text-xs font-semibold">
                  + Add
                </Button>
              </div>

              {/* Current Skills List */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Your Current Skills ({skills.length})
                </label>
                {skills.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 italic py-2">
                    No existing skills added yet. You can add your skills above or click Continue to start from foundational concepts.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill.name}
                        className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-800 text-xs px-3 py-1.5 rounded-full"
                      >
                        <span className="font-semibold">{skill.name}</span>
                        <span className="text-[10px] bg-white text-slate-500 px-2 py-0.5 rounded-full font-medium border border-slate-200">
                          {skill.proficiency}
                        </span>
                        <button
                          onClick={() => handleRemoveSkill(skill.name)}
                          className="text-slate-400 hover:text-rose-600 font-bold ml-1"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 6: Availability & Commitment */}
          {step === 6 && (
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-route">Step 6</span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-ink mt-1">Study Availability & Commitment</h2>
                <p className="text-sm text-slate-500 mt-1">Set your target timeline and weekly study schedule.</p>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                    Target Timeline
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {TIMELINE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setTimelineMonths(opt.value)}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${
                          Number(timelineMonths) === opt.value
                            ? "border-route bg-route-light/30 text-route ring-2 ring-route/20"
                            : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                        }`}
                      >
                        <p className="font-bold text-sm text-slate-900">{opt.label}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                    Daily Study Time
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {DAILY_TIME_OPTIONS.map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setDailyTime(time)}
                        className={`py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                          dailyTime === time
                            ? "border-route bg-route text-white shadow-xs font-semibold"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                    Preferred Study Days ({selectedDays.length} days selected)
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {DAYS_OF_WEEK.map((day) => {
                      const selected = selectedDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                            selected
                              ? "border-route bg-route-light/40 text-route ring-2 ring-route/20"
                              : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Calculated commitment preview */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⏱️</span>
                    <span>Target: <strong>{timelineMonths} months</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🕐</span>
                    <span>Dedication: <strong>{Math.round(((DAILY_TIME_HOURS[dailyTime] || 2) * selectedDays.length) * 10) / 10} hours/week</strong> ({selectedDays.length} days × {dailyTime}/day)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="mt-6 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Bottom Actions */}
          <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleBack}
              disabled={step === 1 || step === 4}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              ← Back
            </button>

            {step === 4 ? (
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium italic pr-2">
                ⚡ Select an answer above to advance ({varkQuestionIndex + 1}/{VARK_QUESTIONS.length})
              </span>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={parsingGoal || scoringVark}
                className="px-6 py-2.5 text-sm font-semibold shadow-xs"
              >
                {parsingGoal
                  ? "Analyzing Goal..."
                  : scoringVark
                  ? "Scoring Preferences..."
                  : step === 6
                  ? "Review Profile Summary →"
                  : "Continue →"}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
