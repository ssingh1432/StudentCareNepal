import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BarChart,
  BookOpen,
  FileText,
  UserPlus,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active: boolean;
  onClick?: () => void;
}

const SidebarLink = ({ href, icon, children, active, onClick }: SidebarLinkProps) => {
  return (
    <Link href={href}>
      <a
        className={cn(
          "flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors",
          active
            ? "text-white bg-purple-600"
            : "text-gray-700 hover:bg-purple-100 hover:text-purple-600"
        )}
        onClick={onClick}
      >
        <span className="mr-3">{icon}</span>
        {children}
      </a>
    </Link>
  );
};

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Close mobile menu when location changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const isAdmin = user?.role === 'admin';
  
  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed z-30 top-0 left-0 p-4 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
      </div>
      
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black/50 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        className={cn(
          "fixed md:sticky top-0 z-20 flex h-screen w-64 flex-col bg-white border-r border-gray-200 transition-transform md:translate-x-0",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-center">
          <h1 className="text-xl font-bold text-purple-600">Nepal Central HS</h1>
        </div>
        
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center mb-4">
              <div className="mr-3 flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 font-medium">
                  {user?.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              <SidebarLink
                href="/"
                icon={<LayoutDashboard className="h-5 w-5" />}
                active={location === '/'}
              >
                Dashboard
              </SidebarLink>
              
              {isAdmin && (
                <SidebarLink
                  href="/teachers"
                  icon={<Users className="h-5 w-5" />}
                  active={location === '/teachers'}
                >
                  Manage Teachers
                </SidebarLink>
              )}
              
              <SidebarLink
                href="/students"
                icon={<GraduationCap className="h-5 w-5" />}
                active={location === '/students'}
              >
                Students
              </SidebarLink>
              
              <SidebarLink
                href="/progress"
                icon={<BarChart className="h-5 w-5" />}
                active={location === '/progress'}
              >
                Progress Tracking
              </SidebarLink>
              
              <SidebarLink
                href="/plans"
                icon={<BookOpen className="h-5 w-5" />}
                active={location === '/plans'}
              >
                Teaching Plans
              </SidebarLink>
              
              <SidebarLink
                href="/reports"
                icon={<FileText className="h-5 w-5" />}
                active={location === '/reports'}
              >
                Reports
              </SidebarLink>
              
              {isAdmin && (
                <SidebarLink
                  href="/assign-students"
                  icon={<UserPlus className="h-5 w-5" />}
                  active={location === '/assign-students'}
                >
                  Assign Students
                </SidebarLink>
              )}
            </div>
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="flex w-full items-center text-red-600 hover:bg-red-50"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );
}
