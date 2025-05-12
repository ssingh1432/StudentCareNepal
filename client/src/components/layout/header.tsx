import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Menu, X, Bell } from "lucide-react";
import { Sidebar } from "./sidebar";

type HeaderProps = {
  title: string;
};

export function Header({ title }: HeaderProps) {
  const { user } = useAuth();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <>
      <header className="bg-white shadow-sm">
        <div className="flex items-center justify-between h-16 px-4 md:px-6">
          <div className="flex items-center">
            <button 
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
              onClick={toggleMobileMenu}
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
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
            
            <div className="md:hidden flex items-center">
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 text-sm font-medium">
                  {user?.name?.slice(0, 1).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={toggleMobileMenu}></div>
          <div className="relative flex flex-col w-full max-w-xs bg-white h-full">
            <Sidebar />
          </div>
        </div>
      )}
    </>
  );
}
