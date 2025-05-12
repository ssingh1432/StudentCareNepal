import { Menu, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart2,
  FileText,
  Presentation,
  UserPlus,
  LogOut
} from "lucide-react";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logout, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-center">
                  <h1 className="text-xl font-bold text-purple-600">Nepal Central HS</h1>
                </div>
              </div>
              
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="mr-3 flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <span className="text-purple-600 font-medium">
                      {user?.name.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user?.name || 'User'}</p>
                    <p className="text-xs text-gray-500 capitalize">{user?.role || 'User'}</p>
                  </div>
                </div>
              </div>
              
              <nav className="flex-1 p-4">
                <div className="space-y-3">
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <LayoutDashboard className="h-5 w-5 mr-3" />
                      Dashboard
                    </Button>
                  </Link>
                  
                  <Link href="/students" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <Users className="h-5 w-5 mr-3" />
                      Students
                    </Button>
                  </Link>
                  
                  <Link href="/progress-tracking" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <BarChart2 className="h-5 w-5 mr-3" />
                      Progress Tracking
                    </Button>
                  </Link>
                  
                  <Link href="/teaching-plans" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <BookOpen className="h-5 w-5 mr-3" />
                      Teaching Plans
                    </Button>
                  </Link>
                  
                  <Link href="/reports" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      <FileText className="h-5 w-5 mr-3" />
                      Reports
                    </Button>
                  </Link>
                  
                  {isAdmin && (
                    <>
                      <div className="pt-4 mt-4 border-t border-gray-200">
                        <h3 className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Admin</h3>
                      </div>
                      
                      <Link href="/manage-teachers" onClick={() => setOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <Presentation className="h-5 w-5 mr-3" />
                          Manage Teachers
                        </Button>
                      </Link>
                      
                      <Link href="/assign-students" onClick={() => setOpen(false)}>
                        <Button variant="ghost" className="w-full justify-start">
                          <UserPlus className="h-5 w-5 mr-3" />
                          Assign Students
                        </Button>
                      </Link>
                    </>
                  )}
                  
                  <div className="pt-4 mt-4 border-t border-gray-200">
                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700" onClick={handleLogout}>
                      <LogOut className="h-5 w-5 mr-3" />
                      Logout
                    </Button>
                  </div>
                </div>
              </nav>
            </SheetContent>
          </Sheet>
          
          <h1 className="ml-2 md:ml-0 text-lg font-semibold text-gray-900">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-500">
              <Bell className="h-5 w-5" />
            </Button>
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
          </div>
          
          <div className="md:hidden flex items-center">
            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 text-sm font-medium">
                {user?.name.charAt(0) || 'U'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
