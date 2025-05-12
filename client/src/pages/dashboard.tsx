import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { getDashboardStats } from "@/lib/api";
import { DashboardStats } from "@/types";
import { User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  BookOpen,
  BarChart2,
  School,
  FileText,
  UserPlus,
  PlusCircle,
  Download
} from "lucide-react";

interface DashboardProps {
  user: User;
}

export default function Dashboard({ user }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const isAdmin = user.role === "admin";

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        toast({
          title: "Error",
          description: "Failed to load dashboard statistics",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [toast]);

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Welcome back, {user.name}</p>
          </div>

          <div className="flex space-x-3">
            <Button asChild>
              <Link to="/students/add">
                <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                Add Student
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/reports">
                <Download className="-ml-1 mr-2 h-5 w-5 text-gray-500" />
                Export Report
              </Link>
            </Button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6 flex justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* Dashboard stats */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Students"
                value={stats?.students.total || 0}
                icon={Users}
                linkText="View all students"
                linkHref="/students"
              />
              
              <StatCard
                title="Nursery Class"
                value={stats?.students.nursery || 0}
                icon={School}
                colorClass="bg-yellow-100 text-yellow-800"
                linkText="View Nursery"
                linkHref="/students?class=Nursery"
              />
              
              <StatCard
                title="LKG Class"
                value={stats?.students.lkg || 0}
                icon={School}
                colorClass="bg-blue-100 text-blue-800"
                linkText="View LKG"
                linkHref="/students?class=LKG"
              />
              
              <StatCard
                title="UKG Class"
                value={stats?.students.ukg || 0}
                icon={School}
                colorClass="bg-green-100 text-green-800"
                linkText="View UKG"
                linkHref="/students?class=UKG"
              />
            </div>
          </div>
          
          {/* Second row - Progress & Plans */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Progress Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Progress Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center">
                      <div className="bg-purple-100 p-2 rounded-md">
                        <BarChart2 className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-700">Total Progress Entries</p>
                        <p className="text-xl font-semibold">{stats?.progressEntries || 0}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/progress">View All</Link>
                    </Button>
                  </div>
                  
                  <div className="mt-4">
                    <Button className="w-full" asChild>
                      <Link to="/progress/add">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Record New Progress
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Teaching Plans Stats */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Teaching Plans</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-gray-50 p-3 rounded-md text-center">
                      <p className="text-sm text-gray-500">Annual</p>
                      <p className="text-xl font-semibold">{stats?.plans.annual || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md text-center">
                      <p className="text-sm text-gray-500">Monthly</p>
                      <p className="text-xl font-semibold">{stats?.plans.monthly || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md text-center">
                      <p className="text-sm text-gray-500">Weekly</p>
                      <p className="text-xl font-semibold">{stats?.plans.weekly || 0}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <Button className="w-full" asChild>
                      <Link to="/plans/add">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Create New Plan
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Admin Section */}
          {isAdmin && (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-6">
              <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:px-6 bg-purple-50">
                  <h2 className="text-lg font-medium leading-6 text-gray-900">Teacher Management</h2>
                  <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage teacher accounts and class assignments.</p>
                </div>
                <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-md font-medium text-gray-700">Teachers ({stats?.teachers || 0})</h3>
                    <Button size="sm" asChild>
                      <Link to="/teachers/add">
                        <UserPlus className="-ml-0.5 mr-2 h-4 w-4" />
                        Add Teacher
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Manage Teachers</h4>
                      <p className="text-sm text-gray-500 mb-4">Add, edit, or remove teacher accounts and manage their class assignments.</p>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link to="/teachers">Manage Teachers</Link>
                      </Button>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-md">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Assign Students</h4>
                      <p className="text-sm text-gray-500 mb-4">Assign students to specific teachers based on class and teaching load.</p>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link to="/teachers/assign">Assign Students</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
