import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  BookOpen,
  FileText,
  ChevronRight,
  LogOut,
  UsersRound,
  UserPlus,
  GraduationCap
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const isAdmin = user?.role === "admin";

  const navItems = [
    { href: "/", label: "Dashboard", icon: BarChart3 },
    { href: "/students", label: "Students", icon: GraduationCap },
    { href: "/progress", label: "Progress Tracking", icon: ChevronRight },
    { href: "/teaching-plans", label: "Teaching Plans", icon: BookOpen },
    { href: "/reports", label: "Reports", icon: FileText },
  ];

  const adminNavItems = [
    { href: "/teachers", label: "Manage Teachers", icon: UsersRound },
    { href: "/assign-students", label: "Assign Students", icon: UserPlus },
  ];

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className={cn("hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200", className)}>
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
                {user?.name.split(" ").map(n => n[0]).join("").toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role === "admin" ? "Administrator" : "Teacher"}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                    isActive 
                      ? "text-purple-600 bg-purple-100" 
                      : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
                  )}
                >
                  <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-purple-600" : "text-gray-500 group-hover:text-purple-600")} />
                  {item.label}
                </Link>
              );
            })}

            {isAdmin && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</h3>

                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location === item.href;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "mt-1 flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                        isActive 
                          ? "text-purple-600 bg-purple-100" 
                          : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
                      )}
                    >
                      <Icon className={cn("mr-3 h-5 w-5", isActive ? "text-purple-600" : "text-gray-500 group-hover:text-purple-600")} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
          disabled={logoutMutation.isPending}
        >
          <LogOut className="mr-3 h-5 w-5" />
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );
}
