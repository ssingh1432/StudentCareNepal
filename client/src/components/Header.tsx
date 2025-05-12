import { BellIcon, MenuIcon } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const [location] = useLocation();
  const { user } = useAuth();

  const getPageTitle = () => {
    if (location === "/") return "Dashboard";
    if (location.startsWith("/students")) {
      if (location === "/students/add") return "Add Student";
      if (location.includes("/edit")) return "Edit Student";
      return "Student Management";
    }
    if (location.startsWith("/teachers")) {
      if (location === "/teachers/add") return "Add Teacher";
      if (location.includes("/edit")) return "Edit Teacher";
      return "Teacher Management";
    }
    if (location.startsWith("/progress")) {
      if (location === "/progress/add" || location.includes("/progress/add/")) return "Record Progress";
      return "Progress Tracking";
    }
    if (location.startsWith("/plans")) {
      if (location === "/plans/add") return "Create Teaching Plan";
      if (location.includes("/edit")) return "Edit Teaching Plan";
      return "Teaching Plans";
    }
    if (location.startsWith("/reports")) return "Reports";
    
    return "Nepal Central High School";
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center">
          <button
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            onClick={toggleSidebar}
          >
            <MenuIcon className="h-6 w-6" />
          </button>
          <h1 className="ml-2 md:ml-0 text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none">
              <BellIcon className="h-6 w-6" />
            </button>
            {/* Notification indicator */}
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          </div>
          
          <div className="md:hidden flex items-center">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 font-medium text-sm">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
