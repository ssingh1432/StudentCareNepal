import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Home,
  Users,
  BookOpen,
  FileBarChart,
  FileText,
  UserCog,
  UserPlus,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  isOpen: boolean;
  closeMobileMenu: () => void;
}

const Sidebar = ({ isOpen, closeMobileMenu }: SidebarProps) => {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();
  const isMobile = useMobile();

  const isAdmin = user?.role === "admin";
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleLinkClick = () => {
    if (isMobile) {
      closeMobileMenu();
    }
  };

  if (!user) return null;

  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <Home className="h-5 w-5" />,
      exact: true,
    },
    {
      name: "Students",
      path: "/students",
      icon: <Users className="h-5 w-5" />,
    },
    {
      name: "Progress Tracking",
      path: "/progress",
      icon: <FileBarChart className="h-5 w-5" />,
    },
    {
      name: "Teaching Plans",
      path: "/plans",
      icon: <BookOpen className="h-5 w-5" />,
    },
    {
      name: "Reports",
      path: "/reports",
      icon: <FileText className="h-5 w-5" />,
    },
  ];

  const adminItems = [
    {
      name: "Manage Teachers",
      path: "/teachers",
      icon: <UserCog className="h-5 w-5" />,
    },
    {
      name: "Assign Students",
      path: "/assignments",
      icon: <UserPlus className="h-5 w-5" />,
    },
  ];

  return (
    <div className={cn(
      "fixed md:relative inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full",
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-center">
            <h1 className="text-xl font-bold text-purple-600">Nepal Central HS</h1>
          </div>
        </div>
        
        {/* User info */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <div className="mr-3 flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 font-medium">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role === "admin" ? "Administrator" : "Teacher"}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation links */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                  location === item.path
                    ? "text-purple-600 bg-purple-100"
                    : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
                )}
              >
                <span className="mr-3 text-purple-600">{item.icon}</span>
                {item.name}
              </Link>
            ))}
            
            {/* Admin-only menu items */}
            {isAdmin && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</h3>
                
                {adminItems.map((item) => (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={handleLinkClick}
                    className={cn(
                      "mt-1 flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                      location === item.path
                        ? "text-purple-600 bg-purple-100"
                        : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
                    )}
                  >
                    <span className="mr-3 text-purple-600">{item.icon}</span>
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
        
        {/* Logout button */}
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
