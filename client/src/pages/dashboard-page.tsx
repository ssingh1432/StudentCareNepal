import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/layout/app-layout";
import { StatsSection, ClassDistribution } from "@/components/dashboard/stats";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { Plus, ChartBar, UserPlus, FileText, BookText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Student, Progress, TeachingPlan, User } from "@shared/schema";

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Fetch students
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Fetch teachers (admin only)
  const { data: teachers = [] } = useQuery<User[]>({
    queryKey: ["/api/teachers"],
    enabled: user?.role === "admin",
  });

  // Fetch teaching plans
  const { data: teachingPlans = [] } = useQuery<TeachingPlan[]>({
    queryKey: ["/api/teaching-plans"],
  });

  // Fetch progress entries
  const { data: progressEntries = [] } = useQuery<Progress[]>({
    queryKey: ["/api/progress/all"],
  });

  // Create a map of user IDs to users for displaying names
  const usersMap: Record<number, User> = {};
  if (user) usersMap[user.id] = user;
  teachers.forEach((teacher) => {
    usersMap[teacher.id] = teacher;
  });

  // Check DeepSeek API availability on initial load
  useEffect(() => {
    const checkDeepSeekApi = async () => {
      try {
        const response = await fetch("/api/ai-suggestions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt: "test" }),
        });
        
        if (!response.ok) {
          toast({
            title: "DeepSeek API Not Available",
            description: "AI suggestions will not be available. The application will continue to work without this feature.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error checking DeepSeek API:", error);
      }
    };

    checkDeepSeekApi();
  }, [toast]);

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h2>
          <p className="mt-1 text-sm text-gray-500">
            Here's an overview of the pre-primary student records system
          </p>
        </div>

        {/* Stats Overview Section */}
        <StatsSection 
          students={students} 
          teachers={teachers} 
          teachingPlans={teachingPlans}
          progressEntries={progressEntries}
          showTeachers={user?.role === "admin"}
        />

        {/* Class Distribution & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <ClassDistribution students={students} />
          <RecentActivity 
            students={students} 
            progress={progressEntries} 
            plans={teachingPlans} 
            teachers={teachers}
            usersMap={usersMap}
          />
        </div>

        {/* Quick Actions Section */}
        <Card>
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
          </div>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <Link href="/students/new">
                <a className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-400 hover:bg-purple-50 focus:outline-none">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <UserPlus className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true"></span>
                    <p className="text-sm font-medium text-gray-900">Add New Student</p>
                    <p className="text-xs text-gray-500">Register a new student</p>
                  </div>
                </a>
              </Link>

              <Link href="/progress/new">
                <a className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-400 hover:bg-purple-50 focus:outline-none">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                    <ChartBar className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true"></span>
                    <p className="text-sm font-medium text-gray-900">Record Progress</p>
                    <p className="text-xs text-gray-500">Update student progress</p>
                  </div>
                </a>
              </Link>

              <Link href="/teaching-plans/new">
                <a className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-400 hover:bg-purple-50 focus:outline-none">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <BookText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true"></span>
                    <p className="text-sm font-medium text-gray-900">Create Plan</p>
                    <p className="text-xs text-gray-500">Develop teaching plans</p>
                  </div>
                </a>
              </Link>

              <Link href="/reports">
                <a className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-400 hover:bg-purple-50 focus:outline-none">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="absolute inset-0" aria-hidden="true"></span>
                    <p className="text-sm font-medium text-gray-900">Generate Report</p>
                    <p className="text-xs text-gray-500">Create PDF/Excel reports</p>
                  </div>
                </a>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
