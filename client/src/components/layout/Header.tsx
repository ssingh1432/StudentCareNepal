import { Menu, Bell } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
  toggleSidebar: () => void;
}

const Header = ({ title, toggleSidebar }: HeaderProps) => {
  const [location] = useLocation();
  
  // Function to get a user-friendly page title from path
  const getPageTitle = () => {
    switch (location) {
      case "/":
        return "Dashboard";
      case "/students":
        return "Student Management";
      case "/progress":
        return "Progress Tracking";
      case "/plans":
        return "Teaching Plans";
      case "/reports":
        return "Reports";
      case "/teachers":
        return "Manage Teachers";
      case "/assignments":
        return "Assign Students";
      default:
        return title;
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="md:hidden mr-2"
          >
            <Menu className="h-6 w-6 text-gray-500" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5 text-gray-500" />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
          </div>
          
          <div className="md:hidden flex items-center">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 font-medium text-sm">
                {/* Show first initial only on mobile */}
                U
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
