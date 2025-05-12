import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import { Menu, Bell } from "lucide-react";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user } = useAuth();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center">
          <Sheet open={isMobileNavOpen} onOpenChange={setIsMobileNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="h-6 w-6 text-gray-500" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar />
            </SheetContent>
          </Sheet>

          <h1 className="ml-2 md:ml-0 text-lg font-semibold text-gray-900">{title}</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-gray-500"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
            </Button>
            {/* Notification indicator */}
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          </div>

          <div className="md:hidden flex items-center">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
