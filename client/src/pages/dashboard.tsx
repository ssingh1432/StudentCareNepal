import React, { useState } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import MainLayout from '@/components/layouts/MainLayout';
import { Card, CardContent } from '@/components/ui/card';
import { 
  UserPlus, 
  BarChart, 
  BookOpen, 
  FileText,
  Users, 
  School,
  Presentation 
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface DashboardStats {
  totalStudents: number;
  teacherCount: number;
  progressCount: number;
  planCount: number;
  classCounts: {
    Nursery: number;
    LKG: number;
    UKG: number;
  };
}

interface ActivityItem {
  type: string;
  date: string;
  data: any;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/dashboard/stats'],
  });
  
  // Fetch recent activity
  const { data: activities, isLoading: activitiesLoading } = useQuery<ActivityItem[]>({
    queryKey: ['/api/dashboard/activity'],
  });
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  // Calculate progress percentage
  const getPercentage = (count: number, total: number) => {
    return total > 0 ? Math.round((count / total) * 100) : 0;
  };
  
  return (
    <MainLayout title="Dashboard">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h2>
        <p className="mt-1 text-sm text-gray-500">
          Here's an overview of the pre-primary student records system
        </p>
      </div>
      
      {/* Stats Overview Section */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-purple-100 rounded-md p-3">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                  <dd className="flex items-baseline">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats?.totalStudents || 0}
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <Presentation className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Teachers</dt>
                  <dd className="flex items-baseline">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats?.teacherCount || 0}
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Teaching Plans</dt>
                  <dd className="flex items-baseline">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats?.planCount || 0}
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                <BarChart className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Progress Entries</dt>
                  <dd className="flex items-baseline">
                    {statsLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      <div className="text-2xl font-semibold text-gray-900">
                        {stats?.progressCount || 0}
                      </div>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Class Distribution and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        <Card className="col-span-2">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Students by Class</h3>
          </div>
          <CardContent className="p-6">
            {statsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
                      <span className="text-sm font-medium text-gray-700">Nursery</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {stats?.classCounts.Nursery || 0} students
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ 
                        width: `${getPercentage(
                          stats?.classCounts.Nursery || 0, 
                          stats?.totalStudents || 0
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm font-medium text-gray-700">LKG</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {stats?.classCounts.LKG || 0} students
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${getPercentage(
                          stats?.classCounts.LKG || 0,
                          stats?.totalStudents || 0
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm font-medium text-gray-700">UKG</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {stats?.classCounts.UKG || 0} students
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ 
                        width: `${getPercentage(
                          stats?.classCounts.UKG || 0,
                          stats?.totalStudents || 0
                        )}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
          </div>
          <CardContent className="p-4">
            {activitiesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {activities && activities.length > 0 ? (
                    activities.slice(0, 3).map((activity, index) => {
                      const isLastItem = index === activities.slice(0, 3).length - 1;
                      
                      // Set icon based on activity type
                      let icon;
                      let iconBg;
                      let message = '';
                      
                      switch (activity.type) {
                        case 'student_added':
                          icon = <UserPlus className="text-green-600" />;
                          iconBg = 'bg-green-100';
                          message = `New student <span class="font-medium text-gray-900">${activity.data.name}</span> added to <span class="font-medium text-gray-900">${activity.data.class}</span>`;
                          break;
                        case 'progress_added':
                          icon = <BarChart className="text-blue-600" />;
                          iconBg = 'bg-blue-100';
                          message = `Progress updated for <span class="font-medium text-gray-900">student ${activity.data.studentId}</span>`;
                          break;
                        case 'plan_added':
                          icon = <BookOpen className="text-purple-600" />;
                          iconBg = 'bg-purple-100';
                          message = `New ${activity.data.type.toLowerCase()} plan created for <span class="font-medium text-gray-900">${activity.data.class}</span>`;
                          break;
                        default:
                          icon = <School className="text-gray-600" />;
                          iconBg = 'bg-gray-100';
                          message = 'Activity recorded';
                      }
                      
                      return (
                        <li key={index}>
                          <div className={`relative pb-8 ${!isLastItem ? 'pb-8' : ''}`}>
                            {!isLastItem && (
                              <span
                                className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                aria-hidden="true"
                              ></span>
                            )}
                            <div className="relative flex space-x-3">
                              <div>
                                <span className={`h-8 w-8 rounded-full ${iconBg} flex items-center justify-center ring-8 ring-white`}>
                                  {icon}
                                </span>
                              </div>
                              <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                <div>
                                  <p 
                                    className="text-sm text-gray-500"
                                    dangerouslySetInnerHTML={{ __html: message }}
                                  />
                                </div>
                                <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                  <time>{formatDate(activity.date)}</time>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })
                  ) : (
                    <li className="text-center py-4 text-sm text-gray-500">
                      No recent activity
                    </li>
                  )}
                </ul>
                
                {activities && activities.length > 0 && (
                  <div className="mt-6">
                    <Link href="/activities" className="w-full">
                      <a className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        View all
                      </a>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Quick Actions Section */}
      <Card className="mb-6">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/students?action=add">
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
            
            <Link href="/progress?action=add">
              <a className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-400 hover:bg-purple-50 focus:outline-none">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                  <BarChart className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true"></span>
                  <p className="text-sm font-medium text-gray-900">Record Progress</p>
                  <p className="text-xs text-gray-500">Update student progress</p>
                </div>
              </a>
            </Link>
            
            <Link href="/teaching-plans?action=add">
              <a className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-400 hover:bg-purple-50 focus:outline-none">
                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-blue-600" />
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
    </MainLayout>
  );
};

export default Dashboard;
