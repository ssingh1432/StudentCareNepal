import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StatCard } from "@/components/ui/dashboard/StatCard";
import { ActivityList } from "@/components/ui/dashboard/ActivityList";
import { QuickActions } from "@/components/ui/dashboard/QuickActions";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Users, School, BookOpen, Activity, Presentation } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['/api/stats'],
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Dashboard" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name.split(' ')[0] || 'User'}</h2>
            <p className="mt-1 text-sm text-gray-500">Here's an overview of the pre-primary student records system</p>
          </div>

          {isLoadingStats ? (
            <div className="flex justify-center items-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              <StatCard
                title="Total Students"
                value={stats?.totalStudents || 0}
                icon={<Users className="h-5 w-5" />}
                bgColor="bg-purple-100"
                iconColor="text-purple-600"
                href="/students"
                linkText="View all students"
              />
              
              <StatCard
                title="Nursery Class"
                value={stats?.classCount?.Nursery || 0}
                icon={<School className="h-5 w-5" />}
                bgColor="bg-yellow-100"
                iconColor="text-yellow-600"
                href="/students?class=Nursery"
                linkText="Manage Nursery"
              />
              
              <StatCard
                title="LKG Class"
                value={stats?.classCount?.LKG || 0}
                icon={<School className="h-5 w-5" />}
                bgColor="bg-blue-100"
                iconColor="text-blue-600"
                href="/students?class=LKG"
                linkText="Manage LKG"
              />
              
              <StatCard
                title="UKG Class"
                value={stats?.classCount?.UKG || 0}
                icon={<School className="h-5 w-5" />}
                bgColor="bg-green-100"
                iconColor="text-green-600"
                href="/students?class=UKG"
                linkText="Manage UKG"
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Additional stats for admins */}
            {user?.role === 'admin' && (
              <div className="bg-white shadow rounded-lg col-span-2">
                <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Teacher Management</h3>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">
                    Manage teacher accounts and class assignments
                  </p>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <StatCard
                      title="Teachers"
                      value={stats?.teacherCount || 0}
                      icon={<Presentation className="h-5 w-5" />}
                      bgColor="bg-indigo-100"
                      iconColor="text-indigo-600"
                      href="/manage-teachers"
                      linkText="Manage Teachers"
                    />
                    
                    <StatCard
                      title="Teaching Plans"
                      value={stats?.planCount || 0}
                      icon={<BookOpen className="h-5 w-5" />}
                      bgColor="bg-cyan-100"
                      iconColor="text-cyan-600"
                      href="/teaching-plans"
                      linkText="View Plans"
                    />
                    
                    <StatCard
                      title="Progress Entries"
                      value={stats?.progressCount || 0}
                      icon={<Activity className="h-5 w-5" />}
                      bgColor="bg-amber-100"
                      iconColor="text-amber-600"
                      href="/progress-tracking"
                      linkText="View Progress"
                    />
                  </div>
                </div>
              </div>
            )}

            <ActivityList />
          </div>

          <QuickActions />
        </main>
      </div>
    </div>
  );
}
