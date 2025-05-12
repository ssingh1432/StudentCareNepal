import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

interface QuickActionProps {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  bgColor: string;
  link: string;
}

const QuickAction = ({ title, description, icon, iconColor, bgColor, link }: QuickActionProps) => (
  <Link href={link}>
    <a className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-400 hover:bg-purple-50 focus:outline-none">
      <div className={`flex-shrink-0 h-10 w-10 rounded-full ${bgColor} flex items-center justify-center`}>
        <i className={`fas ${icon} ${iconColor}`}></i>
      </div>
      <div className="flex-1 min-w-0">
        <span className="absolute inset-0" aria-hidden="true"></span>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </a>
  </Link>
);

export default function QuickActions() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const actions = [
    {
      title: "Add New Student",
      description: "Register a new student",
      icon: "fa-user-plus",
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
      link: "/students?add=true"
    },
    {
      title: "Record Progress",
      description: "Update student progress",
      icon: "fa-chart-line",
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      link: "/progress?add=true"
    },
    {
      title: "Create Plan",
      description: "Develop teaching plans",
      icon: "fa-book",
      iconColor: "text-blue-600",
      bgColor: "bg-blue-100",
      link: "/teaching-plans?add=true"
    },
    {
      title: "Generate Report",
      description: "Create PDF/Excel reports",
      icon: "fa-file-export",
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-100",
      link: "/reports"
    }
  ];

  // Admin-only actions
  if (isAdmin) {
    actions.push({
      title: "Manage Teachers",
      description: "Add or edit teacher accounts",
      icon: "fa-chalkboard-teacher",
      iconColor: "text-indigo-600",
      bgColor: "bg-indigo-100",
      link: "/manage-teachers"
    });
    actions.push({
      title: "Assign Students",
      description: "Assign students to teachers",
      icon: "fa-user-friends",
      iconColor: "text-red-600",
      bgColor: "bg-red-100",
      link: "/assign-students"
    });
  }

  return (
    <Card className="mb-6">
      <CardHeader className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <CardTitle className="text-lg font-medium leading-6 text-gray-900">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <QuickAction key={action.title} {...action} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
