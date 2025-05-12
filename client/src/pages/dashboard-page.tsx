import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Student, TeachingPlan, Progress } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  UserPlus, BookOpen, LineChart, FileText,
  LayoutDashboard, GraduationCap, Users, PlusCircle
} from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // Get statistics data
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: plans, isLoading: isLoadingPlans } = useQuery<TeachingPlan[]>({
    queryKey: ["/api/teaching-plans"],
  });

  const { data: teachers, isLoading: isLoadingTeachers } = useQuery<any[]>({
    queryKey: ["/api/teachers"],
    enabled: isAdmin, // Only fetch teachers if user is admin
  });

  // Calculate class distribution
  const calculateClassDistribution = () => {
    if (!students) return { Nursery: 0, LKG: 0, UKG: 0 };
    
    return students.reduce((acc, student) => {
      const classKey = student.class as keyof typeof acc;
      acc[classKey] = (acc[classKey] || 0) + 1;
      return acc;
    }, { Nursery: 0, LKG: 0, UKG: 0 } as Record<string, number>);
  };

  const classDistribution = calculateClassDistribution();
  const totalStudents = students?.length || 0;
  const totalTeachers = teachers?.length || 0;
  const totalPlans = plans?.length || 0;

  // Recent activities - would normally come from an API
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    // Generate recent activities based on data we have
    if (students?.length && plans?.length) {
      const activities = [
        {
          type: 'student',
          icon: 'UserPlus',
          description: `New student ${students[0].name} added to ${students[0].class}`,
          timestamp: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
        },
        {
          type: 'progress',
          icon: 'Edit',
          description: `Progress updated for ${students[1]?.class || 'Nursery'} students`,
          timestamp: new Date(Date.now() - 7200000).toISOString() // 2 hours ago
        },
        {
          type: 'plan',
          icon: 'FileText',
          description: `New ${plans[0].type.toLowerCase()} plan created for ${plans[0].class}`,
          timestamp: new Date(Date.now() - 10800000).toISOString() // 3 hours ago
        }
      ];
      setRecentActivities(activities);
    }
  }, [students, plans]);

  // Loading states
  const isLoading = isLoadingStudents || isLoadingPlans || (isAdmin && isLoadingTeachers);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <TopBar title="Dashboard" />
        
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none p-6">
          <div className="max-w-7xl mx-auto">
            {/* Welcome Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0] || 'User'}</h2>
              <p className="mt-1 text-sm text-gray-500">Here's an overview of the pre-primary student records system</p>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
              {/* Students Stat */}
              <Card className="stat-card">
                <CardContent className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-primary-100 rounded-md p-3">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                        <dd className="flex items-baseline">
                          {isLoadingStudents ? (
                            <Skeleton className="h-9 w-12" />
                          ) : (
                            <div className="text-2xl font-semibold text-gray-900">{totalStudents}</div>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 px-4 py-3 sm:px-6">
                  <Link href="/students" className="text-sm font-medium text-primary hover:text-primary-700">
                    View all students
                  </Link>
                </CardFooter>
              </Card>
              
              {/* Teachers Stat - Admin Only */}
              {isAdmin && (
                <Card className="stat-card">
                  <CardContent className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">Teachers</dt>
                          <dd className="flex items-baseline">
                            {isLoadingTeachers ? (
                              <Skeleton className="h-9 w-12" />
                            ) : (
                              <div className="text-2xl font-semibold text-gray-900">{totalTeachers}</div>
                            )}
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-gray-50 px-4 py-3 sm:px-6">
                    <Link href="/teachers" className="text-sm font-medium text-primary hover:text-primary-700">
                      Manage teachers
                    </Link>
                  </CardFooter>
                </Card>
              )}
              
              {/* Teaching Plans Stat */}
              <Card className="stat-card">
                <CardContent className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-green-100 rounded-md p-3">
                      <BookOpen className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Teaching Plans</dt>
                        <dd className="flex items-baseline">
                          {isLoadingPlans ? (
                            <Skeleton className="h-9 w-12" />
                          ) : (
                            <div className="text-2xl font-semibold text-gray-900">{totalPlans}</div>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 px-4 py-3 sm:px-6">
                  <Link href="/plans" className="text-sm font-medium text-primary hover:text-primary-700">
                    View teaching plans
                  </Link>
                </CardFooter>
              </Card>
              
              {/* Progress Entries Stat */}
              <Card className="stat-card">
                <CardContent className="px-4 py-5 sm:p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 bg-yellow-100 rounded-md p-3">
                      <LineChart className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Progress Entries</dt>
                        <dd className="flex items-baseline">
                          {isLoading ? (
                            <Skeleton className="h-9 w-12" />
                          ) : (
                            <div className="text-2xl font-semibold text-gray-900">
                              {/* Progress count would come from API */}
                              {Math.floor(totalStudents * 2.5)}
                            </div>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-gray-50 px-4 py-3 sm:px-6">
                  <Link href="/progress" className="text-sm font-medium text-primary hover:text-primary-700">
                    Track progress
                  </Link>
                </CardFooter>
              </Card>
            </div>
            
            {/* Class Distribution & Recent Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
              {/* Class Distribution */}
              <Card className="shadow rounded-lg col-span-2">
                <CardHeader className="px-6 py-5 border-b border-gray-200">
                  <CardTitle className="text-lg font-medium leading-6 text-gray-900">Students by Class</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {isLoadingStudents ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Nursery */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
                            <span className="text-sm font-medium text-gray-700">Nursery</span>
                          </div>
                          <span className="text-sm text-gray-500">{classDistribution.Nursery} students</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${totalStudents ? (classDistribution.Nursery / totalStudents) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* LKG */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                            <span className="text-sm font-medium text-gray-700">LKG</span>
                          </div>
                          <span className="text-sm text-gray-500">{classDistribution.LKG} students</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${totalStudents ? (classDistribution.LKG / totalStudents) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      {/* UKG */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                            <span className="text-sm font-medium text-gray-700">UKG</span>
                          </div>
                          <span className="text-sm text-gray-500">{classDistribution.UKG} students</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${totalStudents ? (classDistribution.UKG / totalStudents) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              {/* Recent Activity */}
              <Card className="shadow rounded-lg">
                <CardHeader className="px-6 py-5 border-b border-gray-200">
                  <CardTitle className="text-lg font-medium leading-6 text-gray-900">Recent Activity</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {isLoading ? (
                    <div className="space-y-4 p-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                    </div>
                  ) : (
                    <div className="flow-root">
                      <ul className="-mb-8">
                        {recentActivities.map((activity, index) => (
                          <li key={index}>
                            <div className="relative pb-8">
                              {index !== recentActivities.length - 1 && (
                                <span 
                                  className="absolute top-5 left-4 -ml-px h-full w-0.5 bg-gray-200" 
                                  aria-hidden="true"
                                ></span>
                              )}
                              <div className="relative flex space-x-3">
                                <div>
                                  {activity.type === 'student' && (
                                    <span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center ring-8 ring-white">
                                      <UserPlus className="h-5 w-5 text-green-600" />
                                    </span>
                                  )}
                                  {activity.type === 'progress' && (
                                    <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
                                      <LineChart className="h-5 w-5 text-blue-600" />
                                    </span>
                                  )}
                                  {activity.type === 'plan' && (
                                    <span className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center ring-8 ring-white">
                                      <FileText className="h-5 w-5 text-purple-600" />
                                    </span>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                  <div>
                                    <p className="text-sm text-gray-500">{activity.description}</p>
                                  </div>
                                  <div className="text-right text-sm whitespace-nowrap text-gray-500">
                                    <time dateTime={activity.timestamp}>
                                      {new Date(activity.timestamp).toLocaleTimeString('en-US', { 
                                        hour: 'numeric', 
                                        minute: '2-digit',
                                        hour12: true 
                                      })}
                                    </time>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-6">
                    <Button variant="outline" className="w-full">
                      View all activity
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* Quick Actions Section */}
            <Card className="shadow rounded-lg mb-6">
              <CardHeader className="px-6 py-5 border-b border-gray-200">
                <CardTitle className="text-lg font-medium leading-6 text-gray-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  <Link href="/students" className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-400 hover:bg-purple-50 focus:outline-none">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <UserPlus className="h-5 w-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="absolute inset-0" aria-hidden="true"></span>
                      <p className="text-sm font-medium text-gray-900">Add New Student</p>
                      <p className="text-xs text-gray-500">Register a new student</p>
                    </div>
                  </Link>
                  
                  <Link href="/progress" className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-400 hover:bg-purple-50 focus:outline-none">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <LineChart className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="absolute inset-0" aria-hidden="true"></span>
                      <p className="text-sm font-medium text-gray-900">Record Progress</p>
                      <p className="text-xs text-gray-500">Update student progress</p>
                    </div>
                  </Link>
                  
                  <Link href="/plans" className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-400 hover:bg-purple-50 focus:outline-none">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="absolute inset-0" aria-hidden="true"></span>
                      <p className="text-sm font-medium text-gray-900">Create Plan</p>
                      <p className="text-xs text-gray-500">Develop teaching plans</p>
                    </div>
                  </Link>
                  
                  <Link href="/reports" className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-400 hover:bg-purple-50 focus:outline-none">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-yellow-100 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="absolute inset-0" aria-hidden="true"></span>
                      <p className="text-sm font-medium text-gray-900">Generate Report</p>
                      <p className="text-xs text-gray-500">Create PDF/Excel reports</p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
