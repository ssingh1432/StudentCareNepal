import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Bell } from "lucide-react";
import { useLocation } from "wouter";

interface TopBarProps {
  title: string;
}

export function TopBar({ title }: TopBarProps) {
  const [location] = useLocation();
  const { user } = useAuth();
  const [notifications] = useState<number>(0); // Placeholder for notifications count

  // Get display title based on current route
  const getTitle = (): string => {
    // Return provided title if available
    if (title) return title;

    // Map location to title
    const titles: Record<string, string> = {
      '/': 'Dashboard',
      '/students': 'Student Management',
      '/teachers': 'Manage Teachers',
      '/plans': 'Teaching Plans',
      '/progress': 'Progress Tracking',
      '/reports': 'Reports',
      '/assign-students': 'Assign Students'
    };

    return titles[location] || 'Nepal Central High School';
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center">
          <h1 className="text-lg font-semibold text-gray-900">{getTitle()}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button variant="ghost" size="icon" className="p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none">
              <Bell className="h-5 w-5" />
              {notifications > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </Button>
          </div>
          
          <div className="md:hidden flex items-center">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-600 text-sm">
                {user?.name?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
