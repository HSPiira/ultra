import React from "react";
import { Home, Settings, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils"; // optional helper for class merging if you use it

interface SidebarProps {
  links?: { name: string; icon: React.ReactNode; href: string }[];
}

const Sidebar: React.FC<SidebarProps> = ({ 
  links = [
    { name: "Home", icon: <Home size={18} />, href: "#" },
    { name: "Settings", icon: <Settings size={18} />, href: "#" },
  ],
}) => {
  const [open, setOpen] = React.useState(true);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setOpen(!open)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white border rounded-md shadow-sm"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-white border-r shadow-sm transition-all duration-300 z-40",
          open ? "w-64" : "w-0 lg:w-20"
        )}
      >
        <div className="pt-16 flex flex-col h-full overflow-hidden">
          <nav className="flex-1 overflow-y-auto">
            <ul className="space-y-2 px-3">
              {links.map((link) => (
                <li key={link.name}>
                  <a
                    href={link.href}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 text-gray-700"
                  >
                    {link.icon}
                    <span
                      className={cn(
                        "text-sm font-medium transition-opacity",
                        open ? "opacity-100" : "opacity-0 lg:opacity-100"
                      )}
                    >
                      {link.name}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="p-3 border-t text-xs text-gray-500">
            © {new Date().getFullYear()} MyApp
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
