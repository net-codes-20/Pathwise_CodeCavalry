import { Routes, Route, Navigate, useParams } from "react-router-dom";
import { LearnerProvider } from "./context/LearnerContext.jsx";

// Landing & Auth
import Landing from "./pages/Landing.jsx";
import Login from "./pages/auth/Login.jsx";
import Signup from "./pages/auth/Signup.jsx";

// Onboarding Flow
import OnboardingFlow from "./pages/onboarding/OnboardingFlow.jsx";
import AIAnalyzing from "./pages/onboarding/AIAnalyzing.jsx";
import ProfileSummary from "./pages/onboarding/ProfileSummary.jsx";

// Core App Dashboard
import HomeDashboard from "./pages/app/HomeDashboard.jsx";
import RoadmapView from "./pages/app/RoadmapView.jsx";
import RoadmapItemDetail from "./pages/app/RoadmapItemDetail.jsx";
import ExploreView from "./pages/app/ExploreView.jsx";
import ProgressView from "./pages/app/ProgressView.jsx";
import SkillsView from "./pages/app/SkillsView.jsx";
import MentorView from "./pages/app/MentorView.jsx";
import SettingsView from "./pages/app/SettingsView.jsx";
import ProfileView from "./pages/app/ProfileView.jsx";
import NewGoalView from "./pages/app/NewGoalView.jsx";

function LegacyRoadmapRedirect() {
  const { id } = useParams();
  return <Navigate to={`/app/roadmap/${id}`} replace />;
}

export default function App() {
  return (
    <LearnerProvider>
      <Routes>
        {/* Public & Landing */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Onboarding */}
        <Route path="/onboarding" element={<OnboardingFlow />} />
        <Route path="/onboarding/:step" element={<OnboardingFlow />} />
        <Route path="/onboarding/analyzing" element={<AIAnalyzing />} />
        <Route path="/onboarding/summary" element={<ProfileSummary />} />

        {/* Main Application */}
        <Route path="/app" element={<Navigate to="/app/home" replace />} />
        <Route path="/app/home" element={<HomeDashboard />} />
        <Route path="/app/new-goal" element={<NewGoalView />} />
        <Route path="/app/roadmap" element={<RoadmapView />} />
        <Route path="/app/roadmap/:roadmapId" element={<RoadmapView />} />
        <Route path="/app/roadmap/:roadmapId/item/:itemId" element={<RoadmapItemDetail />} />
        <Route path="/app/explore" element={<ExploreView />} />
        <Route path="/app/progress" element={<ProgressView />} />
        <Route path="/app/skills" element={<SkillsView />} />
        <Route path="/app/mentor" element={<MentorView />} />
        <Route path="/app/settings" element={<SettingsView />} />
        <Route path="/app/profile" element={<Navigate to="/app/settings" replace />} />

        {/* Legacy & Backward Compatibility Redirects */}
        <Route path="/start" element={<Navigate to="/login" replace />} />
        <Route path="/review" element={<Navigate to="/onboarding/summary" replace />} />
        <Route path="/profile/review" element={<Navigate to="/onboarding/summary" replace />} />
        <Route path="/assessment/vark" element={<Navigate to="/onboarding" replace />} />
        <Route path="/roadmap/generating" element={<Navigate to="/onboarding/analyzing" replace />} />
        <Route path="/roadmap/:id" element={<LegacyRoadmapRedirect />} />
        <Route path="/roadmap/:id/replanned" element={<LegacyRoadmapRedirect />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </LearnerProvider>
  );
}
