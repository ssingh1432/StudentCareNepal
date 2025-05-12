import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { getInitials } from "@/lib/utils";
import { 
  LayoutDashboard, 
  Users, 
  Book, 
  ChartBar, 
  FileText, 
  LogOut,
  UserPlus,
  Settings,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ 
  href, 
  icon, 
  children, 
  isActive,
  onClick
}) => {
  return (
    <Link href={href}>
      <a 
        className={cn(
          "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
          isActive 
            ? "text-white bg-sidebar-background" 
            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        )}
        onClick={onClick}
      >
        <span className="mr-3">{icon}</span>
        {children}
      </a>
    </Link>
  );
};

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={toggleMobileMenu}
          className="bg-white"
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div 
        className={cn(
          "md:flex md:flex-col md:w-64 bg-purple-600 border-r border-sidebar-border",
          isMobileMenuOpen ? "fixed inset-y-0 left-0 z-40 flex flex-col w-64" : "hidden"
        )}
      >
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center justify-center">
            <h1 className="text-xl font-bold text-white">Nepal Central HS</h1>
          </div>
        </div>
        
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-4 border-b border-sidebar-border">
            <div className="flex items-center mb-4">
              <div className="mr-3 flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-medium">
                  {user?.name ? getInitials(user.name) : "?"}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-white">{user?.name || "User"}</p>
                <p className="text-xs text-purple-200">{user?.role === "admin" ? "Administrator" : "Teacher"}</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              <SidebarLink 
                href="/dashboard" 
                icon={<LayoutDashboard className="h-5 w-5" />} 
                isActive={location === "/dashboard" || location === "/"}
                onClick={closeMobileMenu}
              >
                Dashboard
              </SidebarLink>
              
              <SidebarLink 
                href="/students" 
                icon={<Users className="h-5 w-5" />} 
                isActive={location === "/students"}
                onClick={closeMobileMenu}
              >
                Students
              </SidebarLink>
              
              <SidebarLink 
                href="/progress" 
                icon={<ChartBar className="h-5 w-5" />} 
                isActive={location === "/progress"}
                onClick={closeMobileMenu}
              >
                Progress Tracking
              </SidebarLink>
              
              <SidebarLink 
                href="/plans" 
                icon={<Book className="h-5 w-5" />} 
                isActive={location === "/plans"}
                onClick={closeMobileMenu}
              >
                Teaching Plans
              </SidebarLink>
              
              <SidebarLink 
                href="/reports" 
                icon={<FileText className="h-5 w-5" />} 
                isActive={location === "/reports"}
                onClick={closeMobileMenu}
              >
                Reports
              </SidebarLink>
              
              {/* Admin-only menu items */}
              {user?.role === "admin" && (
                <div className="pt-4 mt-4 border-t border-sidebar-border">
                  <h3 className="px-2 text-xs font-semibold text-purple-200 uppercase tracking-wider">Admin</h3>
                  
                  <div className="mt-1">
                    <SidebarLink 
                      href="/teachers" 
                      icon={<Settings className="h-5 w-5" />} 
                      isActive={location === "/teachers"}
                      onClick={closeMobileMenu}
                    >
                      Manage Teachers
                    </SidebarLink>
                  </div>
                  
                  <div>
                    <SidebarLink 
                      href="/assign-students" 
                      icon={<UserPlus className="h-5 w-5" />} 
                      isActive={location === "/assign-students"}
                      onClick={closeMobileMenu}
                    >
                      Assign Students
                    </SidebarLink>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>
        
        <div className="p-4 border-t border-sidebar-border">
          <button 
            onClick={() => {
              logout();
              closeMobileMenu();
            }}
            className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-100 rounded-md hover:bg-red-800 hover:text-white"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
