import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, BookOpen, School, FileText, PlusCircle,
  Activity, ArrowRight, Download, BarChart
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Stat card component for dashboard
type StatCardProps = {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  link?: string;
};

const StatCard = ({ title, value, icon, color, link }: StatCardProps) => (
  <Card className="bg-white overflow-hidden shadow rounded-lg">
    <CardContent className="px-4 py-5 sm:p-6">
      <div className="flex items-center">
        <div className={`flex-shrink-0 rounded-md p-3 ${color}`}>
          {icon}
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
            </dd>
          </dl>
        </div>
      </div>
    </CardContent>
    {link && (
      <div className="bg-gray-50 px-4 py-4 sm:px-6">
        <div className="text-sm">
          <Link href={link}>
            <a className="font-medium text-purple-600 hover:text-purple-500 flex items-center">
              View all
              <ArrowRight className="ml-1 h-4 w-4" />
            </a>
          </Link>
        </div>
      </div>
    )}
  </Card>
);

// Progress bar component for class distribution
type ProgressBarProps = {
  label: string;
  value: number;
  total: number;
  color: string;
};

const ProgressBar = ({ label, value, total, color }: ProgressBarProps) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
          <span className="text-sm font-medium text-gray-700">{label}</span>
        </div>
        <span className="text-sm text-gray-500">{value} students</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

// Activity item component for recent activities
type ActivityItemProps = {
  icon: React.ReactNode;
  iconBg: string;
  description: React.ReactNode;
  time: string;
};

const ActivityItem = ({ icon, iconBg, description, time }: ActivityItemProps) => (
  <li>
    <div className="relative pb-8">
      <div className="relative flex space-x-3">
        <div>
          <span className={`h-8 w-8 rounded-full ${iconBg} flex items-center justify-center ring-8 ring-white`}>
            {icon}
          </span>
        </div>
        <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
          <div>
            <p className="text-sm text-gray-500">{description}</p>
          </div>
          <div className="text-right text-sm whitespace-nowrap text-gray-500">
            <time dateTime={time}>{time}</time>
          </div>
        </div>
      </div>
    </div>
  </li>
);

// Quick action component for dashboard
type ActionCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  iconBg: string;
  link: string;
};

const ActionCard = ({ title, description, icon, iconBg, link }: ActionCardProps) => (
  <Link href={link}>
    <a className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-400 hover:bg-purple-50 focus:outline-none">
      <div className={`flex-shrink-0 h-10 w-10 rounded-full ${iconBg} flex items-center justify-center`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <span className="absolute inset-0" aria-hidden="true"></span>
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </a>
  </Link>
);

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Fetch statistics data
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/statistics'],
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Dashboard" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0] || 'User'}</h2>
            <p className="mt-1 text-sm text-gray-500">Here's an overview of the pre-primary student records system</p>
          </div>
          
          {/* Stats Overview */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            {isLoading ? (
              // Loading skeletons
              Array(4).fill(0).map((_, i) => (
                <Card key={i} className="bg-white overflow-hidden shadow rounded-lg">
                  <CardContent className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <Skeleton className="h-12 w-12 rounded-md" />
                      <div className="ml-5 w-0 flex-1">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-8 w-16" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <StatCard 
                  title="Total Students"
                  value={stats?.totalStudents || 0}
                  icon={<Users className="text-purple-600 h-6 w-6" />}
                  color="bg-purple-100"
                  link="/students"
                />
                
                <StatCard 
                  title="Teachers"
                  value={stats?.totalTeachers || 0}
                  icon={<School className="text-blue-600 h-6 w-6" />}
                  color="bg-blue-100"
                  link={user?.role === 'admin' ? "/teachers" : undefined}
                />
                
                <StatCard 
                  title="Teaching Plans"
                  value={stats?.totalPlans || 0}
                  icon={<BookOpen className="text-green-600 h-6 w-6" />}
                  color="bg-green-100"
                  link="/plans"
                />
                
                <StatCard 
                  title="Progress Entries"
                  value={stats?.totalProgressEntries || 0}
                  icon={<BarChart className="text-yellow-600 h-6 w-6" />}
                  color="bg-yellow-100"
                  link="/progress"
                />
              </>
            )}
          </div>
          
          {/* Class Distribution and Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            <div className="bg-white shadow rounded-lg col-span-2">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Students by Class</h3>
              </div>
              <div className="p-6">
                {isLoading ? (
                  <div className="space-y-6">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-2 w-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <ProgressBar 
                      label="Nursery"
                      value={stats?.studentsByClass?.Nursery || 0}
                      total={stats?.totalStudents || 0}
                      color="bg-purple-600"
                    />
                    
                    <ProgressBar 
                      label="LKG"
                      value={stats?.studentsByClass?.LKG || 0}
                      total={stats?.totalStudents || 0}
                      color="bg-blue-500"
                    />
                    
                    <ProgressBar 
                      label="UKG"
                      value={stats?.studentsByClass?.UKG || 0}
                      total={stats?.totalStudents || 0}
                      color="bg-green-500"
                    />
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-4">
                {isLoading ? (
                  <div className="space-y-4">
                    {Array(3).fill(0).map((_, i) => (
                      <div key={i} className="flex space-x-3">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="flex-1">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-3 w-20" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flow-root">
                    <ul className="-mb-8">
                      <ActivityItem 
                        icon={<PlusCircle className="text-green-600 h-5 w-5" />}
                        iconBg="bg-green-100"
                        description={<>New student <span className="font-medium text-gray-900">Anjali Sharma</span> added to <span className="font-medium text-gray-900">LKG</span></>}
                        time="1h ago"
                      />
                      
                      <ActivityItem 
                        icon={<Activity className="text-blue-600 h-5 w-5" />}
                        iconBg="bg-blue-100"
                        description={<>Progress updated for <span className="font-medium text-gray-900">Nursery</span> students</>}
                        time="2h ago"
                      />
                      
                      <ActivityItem 
                        icon={<FileText className="text-purple-600 h-5 w-5" />}
                        iconBg="bg-purple-100"
                        description={<>New weekly plan created for <span className="font-medium text-gray-900">UKG</span></>}
                        time="3h ago"
                      />
                    </ul>
                  </div>
                )}
                <div className="mt-6">
                  <Button variant="outline" className="w-full">
                    View all
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <ActionCard 
                  title="Add New Student"
                  description="Register a new student"
                  icon={<Users className="text-purple-600 h-5 w-5" />}
                  iconBg="bg-purple-100"
                  link="/students?action=add"
                />
                
                <ActionCard 
                  title="Record Progress"
                  description="Update student progress"
                  icon={<Activity className="text-green-600 h-5 w-5" />}
                  iconBg="bg-green-100"
                  link="/progress?action=add"
                />
                
                <ActionCard 
                  title="Create Plan"
                  description="Develop teaching plans"
                  icon={<BookOpen className="text-blue-600 h-5 w-5" />}
                  iconBg="bg-blue-100"
                  link="/plans?action=add"
                />
                
                <ActionCard 
                  title="Generate Report"
                  description="Create PDF/Excel reports"
                  icon={<Download className="text-yellow-600 h-5 w-5" />}
                  iconBg="bg-yellow-100"
                  link="/reports"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
