import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  BarChartBig,
  FileText,
  UserPlus,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className = "" }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isMobile } = useMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Logout handler
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Sidebar navigation items
  const navItems = [
    {
      name: "Dashboard",
      path: "/",
      icon: <LayoutDashboard className="sidebar-icon" />,
      adminOnly: false
    },
    {
      name: "Students",
      path: "/students",
      icon: <GraduationCap className="sidebar-icon" />,
      adminOnly: false
    },
    {
      name: "Progress Tracking",
      path: "/progress",
      icon: <BarChartBig className="sidebar-icon" />,
      adminOnly: false
    },
    {
      name: "Teaching Plans",
      path: "/plans",
      icon: <BookOpen className="sidebar-icon" />,
      adminOnly: false
    },
    {
      name: "Reports",
      path: "/reports",
      icon: <FileText className="sidebar-icon" />,
      adminOnly: false
    },
    {
      name: "Manage Teachers",
      path: "/teachers",
      icon: <Users className="sidebar-icon" />,
      adminOnly: true
    },
    {
      name: "Assign Students",
      path: "/assign-students",
      icon: <UserPlus className="sidebar-icon" />,
      adminOnly: true
    }
  ];

  // Mobile menu button
  const mobileMenuButton = (
    <Button
      variant="ghost"
      size="icon"
      className="md:hidden fixed top-4 left-4 z-50"
      onClick={toggleMobileMenu}
    >
      {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </Button>
  );

  // Sidebar content
  const sidebarContent = (
    <div className={`flex flex-col h-full bg-primary ${className}`}>
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-bold text-sidebar-foreground">Nepal Central HS</h1>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center mb-4">
            <div className="mr-3 flex-shrink-0 h-10 w-10 rounded-full bg-sidebar-accent flex items-center justify-center">
              <span className="text-primary font-medium">{user?.name?.charAt(0) || 'U'}</span>
            </div>
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">{user?.name || 'User'}</p>
              <p className="text-xs text-sidebar-foreground/70">{user?.role === 'admin' ? 'Administrator' : 'Teacher'}</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems
              .filter(item => !item.adminOnly || user?.role === 'admin')
              .map(item => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`sidebar-link ${location === item.path ? 'active' : ''}`}
                  onClick={() => isMobile && setMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
          </div>
        </nav>
      </div>
      
      <div className="p-4 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full flex items-center px-2 py-2 text-sm font-medium text-sidebar-foreground hover:bg-accent hover:text-primary rounded-md"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
          {logoutMutation.isPending && <span className="ml-2">...</span>}
        </Button>
      </div>
    </div>
  );

  // Render sidebar based on device size
  if (isMobile) {
    return (
      <>
        {mobileMenuButton}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" onClick={toggleMobileMenu}>
            <div 
              className="fixed inset-y-0 left-0 z-50 w-64" 
              onClick={e => e.stopPropagation()}
            >
              {sidebarContent}
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="hidden md:flex md:flex-col md:w-64 h-screen">
      {sidebarContent}
    </div>
  );
}
