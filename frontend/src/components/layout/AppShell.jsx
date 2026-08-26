import { useState } from "react";
import Sidebar from "./Sidebar.jsx";
import Header from "./Header.jsx";
import MobileNav from "./MobileNav.jsx";
import AIDrawer from "../modals/AIDrawer.jsx";

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex flex-col antialiased font-body text-slate-800 dark:text-slate-100">
      {/* Desktop Layout Container */}
      <div className="flex-1 flex">
        {/* Left Desktop Sidebar */}
        <aside className="hidden md:flex w-64 lg:w-72 border-r border-slate-200 bg-white sticky top-0 h-screen flex-col shrink-0 z-10">
          <Sidebar />
        </aside>

        {/* Mobile Slide-out Drawer */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 bg-slate-900/40 z-40 transition-opacity backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <aside
          className={`fixed top-0 left-0 h-screen w-72 bg-white shadow-2xl z-50 flex flex-col md:hidden transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col min-h-screen pb-16 md:pb-0">
          <Header
            onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
            onOpenAI={() => setAiDrawerOpen(true)}
          />

          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav />

      {/* Floating AI Trigger Button (Desktop & Mobile) */}
      <button
        onClick={() => setAiDrawerOpen(true)}
        className="fixed bottom-20 md:bottom-6 right-6 z-30 flex items-center justify-center bg-route hover:bg-route-dark text-white px-5 py-2.5 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 transition-all font-bold text-sm cursor-pointer"
        title="Ask?"
      >
        Ask?
      </button>

      {/* Floating AI Mentor Drawer */}
      <AIDrawer open={aiDrawerOpen} onClose={() => setAiDrawerOpen(false)} />
    </div>
  );
}
