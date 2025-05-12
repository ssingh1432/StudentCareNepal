import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  BarChart2,
  BookOpen,
  ChevronDown,
  FileText,
  Layers,
  LogOut,
  Users,
  User,
  UserPlus,
} from "lucide-react";

export function Sidebar() {
  const { user, isAdmin, logoutMutation } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const handleLogout = () => {
    logoutMutation.mutate();
  };

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
              <User className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <Link href="/">
              <a className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                isActive("/") 
                  ? "text-purple-600 bg-purple-100" 
                  : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
              )}>
                <BarChart2 className="mr-3 h-5 w-5" />
                Dashboard
              </a>
            </Link>
            
            <Link href="/students">
              <a className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                isActive("/students") 
                  ? "text-purple-600 bg-purple-100" 
                  : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
              )}>
                <Users className="mr-3 h-5 w-5" />
                Students
              </a>
            </Link>
            
            <Link href="/progress">
              <a className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                isActive("/progress") 
                  ? "text-purple-600 bg-purple-100" 
                  : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
              )}>
                <Layers className="mr-3 h-5 w-5" />
                Progress Tracking
              </a>
            </Link>
            
            <Link href="/teaching-plans">
              <a className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                isActive("/teaching-plans") 
                  ? "text-purple-600 bg-purple-100" 
                  : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
              )}>
                <BookOpen className="mr-3 h-5 w-5" />
                Teaching Plans
              </a>
            </Link>
            
            <Link href="/reports">
              <a className={cn(
                "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                isActive("/reports") 
                  ? "text-purple-600 bg-purple-100" 
                  : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
              )}>
                <FileText className="mr-3 h-5 w-5" />
                Reports
              </a>
            </Link>
            
            {isAdmin && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</h3>
                
                <Link href="/teachers">
                  <a className={cn(
                    "mt-1 flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                    isActive("/teachers") 
                      ? "text-purple-600 bg-purple-100" 
                      : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
                  )}>
                    <User className="mr-3 h-5 w-5" />
                    Manage Teachers
                  </a>
                </Link>
                
                <Link href="/assignments">
                  <a className={cn(
                    "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                    isActive("/assignments") 
                      ? "text-purple-600 bg-purple-100" 
                      : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
                  )}>
                    <UserPlus className="mr-3 h-5 w-5" />
                    Assign Students
                  </a>
                </Link>
              </div>
            )}
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
          {logoutMutation.isPending ? "Logging out..." : "Logout"}
        </button>
      </div>
    </div>
  );
}
