import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  CalendarIcon, 
  LayoutDashboardIcon, 
  UsersIcon, 
  BookOpenIcon, 
  FileBarChartIcon,
  FileTextIcon,
  LogOutIcon,
  GraduationCapIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const isAdmin = user?.role === "admin";

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboardIcon,
      current: location === "/"
    },
    {
      name: "Students",
      href: "/students",
      icon: GraduationCapIcon,
      current: location.startsWith("/students")
    },
    {
      name: "Progress Tracking",
      href: "/progress",
      icon: FileBarChartIcon,
      current: location.startsWith("/progress")
    },
    {
      name: "Teaching Plans",
      href: "/plans",
      icon: BookOpenIcon,
      current: location.startsWith("/plans")
    },
    {
      name: "Reports",
      href: "/reports",
      icon: FileTextIcon,
      current: location.startsWith("/reports")
    }
  ];

  // Admin-only navigation items
  if (isAdmin) {
    navigation.splice(2, 0, {
      name: "Manage Teachers",
      href: "/teachers",
      icon: UsersIcon,
      current: location.startsWith("/teachers")
    });
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-center">
          <h1 className="text-xl font-bold text-purple-600">Nepal Central HS</h1>
        </div>
      </div>
      
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center mb-4">
            <div className="mr-3 flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 font-medium">
                {user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
        
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center px-2 py-2 text-sm font-medium rounded-md group",
                  item.current
                    ? "text-purple-600 bg-purple-100"
                    : "text-gray-600 hover:bg-purple-100 hover:text-purple-600"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 flex-shrink-0 h-5 w-5",
                    item.current ? "text-purple-600" : "text-gray-500 group-hover:text-purple-600"
                  )}
                />
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50"
        >
          <LogOutIcon className="mr-3 h-5 w-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
