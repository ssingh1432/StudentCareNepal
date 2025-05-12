import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { 
  LayoutDashboard,
  Users,
  BookOpen,
  BarChart2,
  FileText,
  UserPlus,
  LogOut,
  Menu,
  ChevronDown,
  ChevronUp,
  Bell
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";

type MainLayoutProps = {
  children: ReactNode;
  title: string;
};

type SidebarLink = {
  href: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
};

const sidebarLinks: SidebarLink[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    href: "/students",
    label: "Students",
    icon: <Users className="h-5 w-5" />,
  },
  {
    href: "/progress",
    label: "Progress Tracking",
    icon: <BarChart2 className="h-5 w-5" />,
  },
  {
    href: "/teaching-plans",
    label: "Teaching Plans",
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    href: "/reports",
    label: "Reports",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    href: "/manage-teachers",
    label: "Manage Teachers",
    icon: <UserPlus className="h-5 w-5" />,
    adminOnly: true,
  },
  {
    href: "/assign-students",
    label: "Assign Students",
    icon: <Users className="h-5 w-5" />,
    adminOnly: true,
  },
];

export function MainLayout({ children, title }: MainLayoutProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getUserInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar (desktop) */}
      <div className="hidden md:flex md:flex-col md:w-64 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-center">
            <h1 className="text-xl font-bold text-purple-600">Nepal Central HS</h1>
          </div>
        </div>
        
        <div className="flex flex-col flex-1 overflow-y-auto">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center mb-4">
              <div className="mr-3 flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Avatar>
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    {user?.name ? getUserInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div>
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4">
            <div className="space-y-1">
              {sidebarLinks.map((link) => {
                // Skip admin-only links for non-admin users
                if (link.adminOnly && user?.role !== "admin") {
                  return null;
                }
                
                const isActive = location === link.href;
                
                return (
                  <Link 
                    key={link.href} 
                    href={link.href}
                  >
                    <a className={`flex items-center px-2 py-2 text-sm font-medium rounded-md group ${
                      isActive
                        ? "text-purple-600 bg-purple-100"
                        : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
                    }`}>
                      <span className="mr-3 text-gray-500 group-hover:text-purple-600">
                        {link.icon}
                      </span>
                      {link.label}
                    </a>
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
        
        <div className="p-4 border-t border-gray-200">
          <button 
            onClick={handleLogout}
            className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
          >
            <LogOut className="h-5 w-5 mr-3" />
            Logout
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm">
          <div className="flex items-center justify-between h-16 px-4 md:px-6">
            <div className="flex items-center">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6 text-gray-500" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[240px] sm:w-[300px]">
                  <div className="py-4">
                    <div className="px-4 mb-6 flex items-center">
                      <h2 className="text-xl font-bold text-purple-600">Nepal Central HS</h2>
                    </div>
                    <nav>
                      <div className="space-y-1 px-2">
                        {sidebarLinks.map((link) => {
                          // Skip admin-only links for non-admin users
                          if (link.adminOnly && user?.role !== "admin") {
                            return null;
                          }
                          
                          const isActive = location === link.href;
                          
                          return (
                            <Link 
                              key={link.href} 
                              href={link.href}
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              <a className={`flex items-center px-2 py-2 text-base font-medium rounded-md ${
                                isActive
                                  ? "text-purple-600 bg-purple-100"
                                  : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
                              }`}>
                                <span className="mr-3">
                                  {link.icon}
                                </span>
                                {link.label}
                              </a>
                            </Link>
                          );
                        })}
                        <button 
                          onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                          className="w-full flex items-center px-2 py-2 text-base font-medium text-red-600 rounded-md hover:bg-red-50"
                        >
                          <LogOut className="h-5 w-5 mr-3" />
                          Logout
                        </button>
                      </div>
                    </nav>
                  </div>
                </SheetContent>
              </Sheet>
              <h1 className="ml-2 md:ml-0 text-lg font-semibold text-gray-900">{title}</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <button className="p-1 text-gray-400 rounded-full hover:text-gray-500 focus:outline-none">
                  <Bell className="h-6 w-6" />
                </button>
              </div>
              
              <div className="md:hidden flex items-center">
                <Avatar>
                  <AvatarFallback className="bg-purple-100 text-purple-600">
                    {user?.name ? getUserInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
