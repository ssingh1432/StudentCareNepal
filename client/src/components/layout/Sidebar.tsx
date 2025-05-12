import { Link, useLocation } from "wouter";
import { User } from "@/types";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  BookOpen,
  BarChart2,
  FileText,
  UserPlus,
  LogOut,
  ChevronRight
} from "lucide-react";

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

export default function Sidebar({ user, onLogout }: SidebarProps) {
  const [location] = useLocation();
  const isAdmin = user.role === "admin";

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: <Home className="mr-3 h-5 w-5" />,
    },
    {
      name: "Students",
      href: "/students",
      icon: <Users className="mr-3 h-5 w-5" />,
    },
    {
      name: "Progress Tracking",
      href: "/progress",
      icon: <BarChart2 className="mr-3 h-5 w-5" />,
    },
    {
      name: "Teaching Plans",
      href: "/plans",
      icon: <BookOpen className="mr-3 h-5 w-5" />,
    },
    {
      name: "Reports",
      href: "/reports",
      icon: <FileText className="mr-3 h-5 w-5" />,
    }
  ];

  const adminItems = [
    {
      name: "Manage Teachers",
      href: "/teachers",
      icon: <Users className="mr-3 h-5 w-5" />,
    },
    {
      name: "Assign Students",
      href: "/teachers/assign",
      icon: <UserPlus className="mr-3 h-5 w-5" />,
    }
  ];

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-bold text-purple-600">Nepal Central HS</h1>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <div className="mr-3 flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 font-medium">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                  location === item.href 
                    ? "text-purple-600 bg-purple-100" 
                    : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
            
            {isAdmin && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</h3>
                
                {adminItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={cn(
                      "mt-1 flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                      location === item.href 
                        ? "text-purple-600 bg-purple-100" 
                        : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
                    )}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={onLogout}
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
