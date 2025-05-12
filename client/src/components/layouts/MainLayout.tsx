import React, { ReactNode, useState } from 'react';
import Sidebar from './Sidebar';
import { LogOut, Menu, Bell } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();
  
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
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 md:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      
      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed inset-y-0 left-0 z-50 w-64 bg-white transition duration-300 ease-in-out transform md:relative md:translate-x-0 md:flex md:flex-col md:flex-shrink-0 md:static md:z-auto`}
      >
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Main content */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <div className="flex items-center">
              <button
                className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" />
              </button>
              <h1 className="ml-2 md:ml-0 text-lg font-semibold text-gray-900">{title}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none">
                  <Bell className="h-6 w-6" />
                </button>
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              </div>
              
              <div className="hidden md:flex items-center space-x-3">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-medium">
                    {userInitials}
                  </div>
                  <div className="ml-2">
                    <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                    <p className="text-xs text-gray-500">{user?.role === 'admin' ? 'Administrator' : 'Teacher'}</p>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="p-1 rounded text-gray-400 hover:text-red-500 focus:outline-none"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
              
              <div className="md:hidden">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-sm">
                  {userInitials}
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
