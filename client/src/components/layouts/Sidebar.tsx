import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import {
  Home,
  Users,
  BookOpen,
  BarChart,
  FileText,
  LogOut,
  UserPlus,
  Presentation,
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const { user, logoutMutation } = useAuth();
  const [location, setLocation] = useLocation();
  
  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation('/auth');
  };
  
  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  const userInitials = user?.name ? getInitials(user.name) : 'U';
  const isAdmin = user?.role === 'admin';
  
  const navItems = [
    { href: '/', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
    { href: '/students', label: 'Students', icon: <Users className="h-5 w-5" /> },
    { href: '/progress', label: 'Progress Tracking', icon: <BarChart className="h-5 w-5" /> },
    { href: '/teaching-plans', label: 'Teaching Plans', icon: <BookOpen className="h-5 w-5" /> },
    { href: '/reports', label: 'Reports', icon: <FileText className="h-5 w-5" /> },
  ];
  
  const adminItems = [
    { href: '/manage-teachers', label: 'Manage Teachers', icon: <Presentation className="h-5 w-5" /> },
    { href: '/assign-students', label: 'Assign Students', icon: <UserPlus className="h-5 w-5" /> },
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
              <span className="text-purple-600 font-medium">{userInitials}</span>
            </div>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{isAdmin ? 'Administrator' : 'Teacher'}</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={onClose}
              >
                <a
                  className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group
                    ${location === item.href 
                      ? 'text-purple-600 bg-purple-100' 
                      : 'text-gray-600 hover:bg-purple-100 hover:text-purple-600'}`}
                >
                  <span className="mr-3 text-gray-500 group-hover:text-purple-600">
                    {item.icon}
                  </span>
                  {item.label}
                </a>
              </Link>
            ))}
            
            {isAdmin && (
              <div className="pt-4 mt-4 border-t border-gray-200">
                <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</h3>
                
                {adminItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={onClose}
                  >
                    <a
                      className={`mt-1 flex items-center px-2 py-2 text-sm font-medium rounded-md group
                        ${location === item.href 
                          ? 'text-purple-600 bg-purple-100' 
                          : 'text-gray-600 hover:bg-purple-100 hover:text-purple-600'}`}
                    >
                      <span className="mr-3 text-gray-500 group-hover:text-purple-600">
                        {item.icon}
                      </span>
                      {item.label}
                    </a>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
