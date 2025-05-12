import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Users,
  BookOpenCheck,
  LineChart,
  FileText,
  UserCog,
  UserPlus,
  LogOut
} from "lucide-react";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, isAdmin, logoutMutation } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="mr-3 h-5 w-5" />,
      allowedRoles: ["admin", "teacher"]
    },
    {
      name: "Students",
      href: "/students",
      icon: <Users className="mr-3 h-5 w-5" />,
      allowedRoles: ["admin", "teacher"]
    },
    {
      name: "Progress Tracking",
      href: "/progress",
      icon: <LineChart className="mr-3 h-5 w-5" />,
      allowedRoles: ["admin", "teacher"]
    },
    {
      name: "Teaching Plans",
      href: "/plans",
      icon: <BookOpenCheck className="mr-3 h-5 w-5" />,
      allowedRoles: ["admin", "teacher"]
    },
    {
      name: "Reports",
      href: "/reports",
      icon: <FileText className="mr-3 h-5 w-5" />,
      allowedRoles: ["admin", "teacher"]
    },
    {
      name: "Manage Teachers",
      href: "/teachers",
      icon: <UserCog className="mr-3 h-5 w-5" />,
      allowedRoles: ["admin"]
    },
    {
      name: "Assign Students",
      href: "/assign-students",
      icon: <UserPlus className="mr-3 h-5 w-5" />,
      allowedRoles: ["admin"]
    }
  ];

  const filteredNavItems = navItems.filter(item => 
    item.allowedRoles.includes(user.role)
  );

  return (
    <div className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200">
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
                {user.name.slice(0, 2).toUpperCase()}
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
            {filteredNavItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${
                    isActive
                      ? "text-purple-600 bg-purple-100"
                      : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
}
