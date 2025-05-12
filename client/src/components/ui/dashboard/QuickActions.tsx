import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  UserPlus, 
  BarChart2, 
  BookOpen, 
  FileText 
} from "lucide-react";

interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}

function QuickAction({ icon, title, description, href }: QuickActionProps) {
  return (
    <Link href={href}>
      <div className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-400 hover:bg-purple-50 focus:outline-none">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className="absolute inset-0" aria-hidden="true"></span>
          <p className="text-sm font-medium text-gray-900">{title}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </Link>
  );
}

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction
            icon={<UserPlus className="text-purple-600" />}
            title="Add New Student"
            description="Register a new student"
            href="/students?action=add"
          />
          
          <QuickAction
            icon={<BarChart2 className="text-green-600" />}
            title="Record Progress"
            description="Update student progress"
            href="/progress-tracking?action=add"
          />
          
          <QuickAction
            icon={<BookOpen className="text-blue-600" />}
            title="Create Plan"
            description="Develop teaching plans"
            href="/teaching-plans?action=add"
          />
          
          <QuickAction
            icon={<FileText className="text-yellow-600" />}
            title="Generate Report"
            description="Create PDF/Excel reports"
            href="/reports"
          />
        </div>
      </CardContent>
    </Card>
  );
}
