import React from "react";
import { Bell, Settings } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";

const Header: React.FC = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  // Function to get page title based on current location
  const getPageTitle = () => {
    switch (location) {
      case "/dashboard":
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
      case "/assign-students":
        return "Assign Students to Teachers";
      default:
        return "Nepal Central High School";
    }
  };

  return (
    <header className="bg-white shadow-sm no-print">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center">
          <h1 className="ml-2 md:ml-0 text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button variant="ghost" size="icon" className="text-gray-400 rounded-full hover:text-gray-500 focus:outline-none">
              <Bell className="h-5 w-5" />
            </Button>
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8 bg-purple-100">
                  <AvatarFallback className="text-purple-600">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => logout()}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="mr-2 h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
