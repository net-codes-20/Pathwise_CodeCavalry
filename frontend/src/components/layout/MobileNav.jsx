import { NavLink } from "react-router-dom";

const MOBILE_NAV_ITEMS = [
  { to: "/app/home", icon: "🏠", label: "Home" },
  { to: "/app/roadmap", icon: "🗺️", label: "Roadmap" },
  { to: "/app/explore", icon: "📚", label: "Explore" },
  { to: "/app/progress", icon: "📊", label: "Progress" },
  { to: "/app/mentor", icon: "🤖", label: "Mentor" },
  { to: "/app/settings", icon: "⚙️", label: "Settings" },
];

export default function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-30 flex items-center justify-around px-2 shadow-lg">
      {MOBILE_NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full py-1 text-center transition-all ${
              isActive ? "text-route font-bold" : "text-slate-500 hover:text-slate-800"
            }`
          }
        >
          <span className="text-lg">{item.icon}</span>
          <span className="text-[10px] mt-0.5">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
