import { useAuth } from "@/hooks/use-auth";
import { Bell } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user } = useAuth();
  const [hasNotifications] = useState(false);
  
  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center">
          <h1 className="ml-2 md:ml-0 text-lg font-semibold text-gray-900">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none">
              <Bell size={20} />
            </button>
            {hasNotifications && (
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
            )}
          </div>
          
          <div className="md:hidden flex items-center">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 text-sm font-medium">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
