import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  GraduationCap,
  LineChart,
  BookOpen,
  FileText,
  User,
  UserPlus,
  LogOut,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface SidebarProps {
  className?: string;
  collapsed?: boolean;
}

export function Sidebar({ className, collapsed = false }: SidebarProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  // Get the first letter of each word in the user's name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-white border-r border-gray-200",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-center">
          <h1 className={cn("text-xl font-bold text-purple-600", collapsed && "hidden")}>
            Nepal Central HS
          </h1>
          {collapsed && (
            <h1 className="text-xl font-bold text-purple-600">NCHS</h1>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className={cn("flex items-center", collapsed && "justify-center")}>
            <Avatar className="h-10 w-10 bg-purple-100 text-purple-600">
              <AvatarFallback>{user ? getInitials(user.name) : "U"}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="ml-3">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <Link href="/">
              <a
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                  isActive("/")
                    ? "text-purple-600 bg-purple-100"
                    : "text-gray-600 hover:bg-purple-100 hover:text-purple-600",
                  collapsed && "justify-center"
                )}
              >
                <Home className="mr-3 text-gray-500 group-hover:text-purple-600 h-5 w-5" />
                {!collapsed && <span>Dashboard</span>}
              </a>
            </Link>

            <Link href="/students">
              <a
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                  isActive("/students")
                    ? "text-purple-600 bg-purple-100"
                    : "text-gray-600 hover:bg-purple-100 hover:text-purple-600",
                  collapsed && "justify-center"
                )}
              >
                <GraduationCap className="mr-3 text-gray-500 group-hover:text-purple-600 h-5 w-5" />
                {!collapsed && <span>Students</span>}
              </a>
            </Link>

            <Link href="/progress">
              <a
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                  isActive("/progress")
                    ? "text-purple-600 bg-purple-100"
                    : "text-gray-600 hover:bg-purple-100 hover:text-purple-600",
                  collapsed && "justify-center"
                )}
              >
                <LineChart className="mr-3 text-gray-500 group-hover:text-purple-600 h-5 w-5" />
                {!collapsed && <span>Progress Tracking</span>}
              </a>
            </Link>

            <Link href="/teaching-plans">
              <a
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                  isActive("/teaching-plans")
                    ? "text-purple-600 bg-purple-100"
                    : "text-gray-600 hover:bg-purple-100 hover:text-purple-600",
                  collapsed && "justify-center"
                )}
              >
                <BookOpen className="mr-3 text-gray-500 group-hover:text-purple-600 h-5 w-5" />
                {!collapsed && <span>Teaching Plans</span>}
              </a>
            </Link>

            <Link href="/reports">
              <a
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                  isActive("/reports")
                    ? "text-purple-600 bg-purple-100"
                    : "text-gray-600 hover:bg-purple-100 hover:text-purple-600",
                  collapsed && "justify-center"
                )}
              >
                <FileText className="mr-3 text-gray-500 group-hover:text-purple-600 h-5 w-5" />
                {!collapsed && <span>Reports</span>}
              </a>
            </Link>

            {user?.role === "admin" && (
              <div className={cn("pt-4 mt-4 border-t border-gray-200", collapsed && "text-center")}>
                {!collapsed && (
                  <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Admin
                  </h3>
                )}

                <Link href="/teachers">
                  <a
                    className={cn(
                      "mt-1 flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                      isActive("/teachers")
                        ? "text-purple-600 bg-purple-100"
                        : "text-gray-600 hover:bg-purple-100 hover:text-purple-600",
                      collapsed && "justify-center"
                    )}
                  >
                    <User className="mr-3 text-gray-500 group-hover:text-purple-600 h-5 w-5" />
                    {!collapsed && <span>Manage Teachers</span>}
                  </a>
                </Link>

                <Link href="/assign-students">
                  <a
                    className={cn(
                      "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                      isActive("/assign-students")
                        ? "text-purple-600 bg-purple-100"
                        : "text-gray-600 hover:bg-purple-100 hover:text-purple-600",
                      collapsed && "justify-center"
                    )}
                  >
                    <UserPlus className="mr-3 text-gray-500 group-hover:text-purple-600 h-5 w-5" />
                    {!collapsed && <span>Assign Students</span>}
                  </a>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className={cn(
            "flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50",
            collapsed && "justify-center"
          )}
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="mr-3 h-5 w-5" />
          {!collapsed && <span>Logout</span>}
        </Button>
      </div>
    </div>
  );
}
