import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { 
  UserPlus, 
  Users, 
  BookOpen, 
  LineChart, 
  Eye, 
  Building2, 
  PanelRight, 
  FileText, 
  BookTemplate 
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Fetch stats
  const { data: students } = useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/students");
      return await res.json();
    },
  });
  
  const { data: teachers } = useQuery({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/teachers");
      return await res.json();
    },
    enabled: user?.role === "admin",
  });
  
  const { data: plans } = useQuery({
    queryKey: ["/api/teaching-plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/teaching-plans");
      return await res.json();
    },
  });
  
  // Calculate counts by class
  const nurseryCount = students?.filter(s => s.class === "Nursery").length || 0;
  const lkgCount = students?.filter(s => s.class === "LKG").length || 0;
  const ukgCount = students?.filter(s => s.class === "UKG").length || 0;
  
  const totalStudents = students?.length || 0;
  const totalTeachers = teachers?.length || 0;
  const totalPlans = plans?.length || 0;
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar title="Dashboard" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name.split(" ")[0]}</h2>
            <p className="mt-1 text-sm text-gray-500">Here's an overview of the pre-primary student records system</p>
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
                        <div className="text-2xl font-semibold text-gray-900">{totalStudents}</div>
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
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Teachers</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">{totalTeachers}</div>
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
                        <div className="text-2xl font-semibold text-gray-900">{totalPlans}</div>
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
                    <LineChart className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Progress Entries</dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">-</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Class Distribution Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
            <div className="bg-white shadow rounded-lg col-span-2">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Students by Class</h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">Nursery</span>
                      </div>
                      <span className="text-sm text-gray-500">{nurseryCount} students</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{ width: `${totalStudents ? (nurseryCount / totalStudents) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">LKG</span>
                      </div>
                      <span className="text-sm text-gray-500">{lkgCount} students</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full" 
                        style={{ width: `${totalStudents ? (lkgCount / totalStudents) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm font-medium text-gray-700">UKG</span>
                      </div>
                      <span className="text-sm text-gray-500">{ukgCount} students</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${totalStudents ? (ukgCount / totalStudents) * 100 : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-4">
                <div className="flow-root">
                  <ul className="-mb-8">
                    <li>
                      <div className="relative pb-8">
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center ring-8 ring-white">
                              <UserPlus className="h-4 w-4 text-green-600" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">System initialized</p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              <time>now</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          {/* Quick Actions Section */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
            </div>
            <div className="p-6">
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
                
                <Link href="/teaching-plans" className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-400 hover:bg-purple-50 focus:outline-none">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <BookTemplate className="h-5 w-5 text-blue-600" />
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
