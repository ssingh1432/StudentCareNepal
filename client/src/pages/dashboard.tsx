import { MainLayout } from "@/components/layout/main-layout";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  School,
  BookOpen,
  BarChart2,
  FileText,
  UserPlus,
  PlusCircle,
  ChevronRight,
  CalendarPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const { user, isAdmin } = useAuth();
  
  // Fetch statistics
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/protected/students'],
  });
  
  const { data: teachingPlans, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['/api/protected/teaching-plans'],
  });
  
  // Count students by class
  const nurseryCount = students?.filter((student: any) => student.class === "Nursery").length || 0;
  const lkgCount = students?.filter((student: any) => student.class === "LKG").length || 0;
  const ukgCount = students?.filter((student: any) => student.class === "UKG").length || 0;
  const totalStudents = students?.length || 0;
  
  // Calculate percentages for progress bars
  const nurseryPercentage = totalStudents > 0 ? (nurseryCount / totalStudents) * 100 : 0;
  const lkgPercentage = totalStudents > 0 ? (lkgCount / totalStudents) * 100 : 0;
  const ukgPercentage = totalStudents > 0 ? (ukgCount / totalStudents) * 100 : 0;
  
  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Welcome message */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name}</h2>
          <p className="mt-1 text-sm text-gray-500">
            Here's an overview of the pre-primary student records system
          </p>
        </div>
        
        {/* Stats cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            title="Total Students" 
            value={isLoadingStudents ? "..." : totalStudents.toString()} 
            icon={<Users className="h-6 w-6 text-purple-600" />}
            bgColor="bg-purple-100"
            link="/students"
          />
          
          <StatCard 
            title="Teaching Plans" 
            value={isLoadingPlans ? "..." : (teachingPlans?.length || "0").toString()} 
            icon={<BookOpen className="h-6 w-6 text-green-600" />}
            bgColor="bg-green-100"
            link="/teaching-plans"
          />
          
          <StatCard 
            title="Nursery Students" 
            value={isLoadingStudents ? "..." : nurseryCount.toString()} 
            icon={<School className="h-6 w-6 text-blue-600" />}
            bgColor="bg-blue-100"
            link="/students?class=Nursery"
          />
          
          <StatCard 
            title="Teachers" 
            value={isAdmin ? "Manage" : "View Profile"} 
            icon={<Users className="h-6 w-6 text-orange-600" />}
            bgColor="bg-orange-100"
            link={isAdmin ? "/teacher-management" : "#"}
          />
        </div>
        
        {/* Class distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>Students by Class</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
                      <span className="text-sm font-medium text-gray-700">Nursery</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {nurseryCount} students
                    </span>
                  </div>
                  <Progress value={nurseryPercentage} className="h-2 bg-gray-200" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                      <span className="text-sm font-medium text-gray-700">LKG</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {lkgCount} students
                    </span>
                  </div>
                  <Progress value={lkgPercentage} className="h-2 bg-gray-200" color="blue" />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm font-medium text-gray-700">UKG</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {ukgCount} students
                    </span>
                  </div>
                  <Progress value={ukgPercentage} className="h-2 bg-gray-200" color="green" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ActivityItem 
                  icon={<PlusCircle size={16} className="text-green-500" />}
                  title="New student added"
                  description="A new student was added to LKG"
                  time="2 hours ago"
                />
                
                <ActivityItem 
                  icon={<BarChart2 size={16} className="text-blue-500" />}
                  title="Progress updated"
                  description="Progress entries updated for Nursery"
                  time="4 hours ago"
                />
                
                <ActivityItem 
                  icon={<CalendarPlus size={16} className="text-purple-500" />}
                  title="New teaching plan"
                  description="Weekly plan created for UKG"
                  time="Yesterday"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="w-full">
                View all activity
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <QuickActionCard 
                title="Add New Student"
                description="Register a student"
                icon={<UserPlus className="h-5 w-5 text-purple-600" />}
                link="/students?new=true"
              />
              
              <QuickActionCard 
                title="Record Progress"
                description="Update student progress"
                icon={<BarChart2 className="h-5 w-5 text-green-600" />}
                link="/progress?new=true"
              />
              
              <QuickActionCard 
                title="Create Plan"
                description="Develop teaching plans"
                icon={<BookOpen className="h-5 w-5 text-blue-600" />}
                link="/teaching-plans?new=true"
              />
              
              <QuickActionCard 
                title="Generate Report"
                description="Create PDF/Excel reports"
                icon={<FileText className="h-5 w-5 text-orange-600" />}
                link="/reports"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  link: string;
}

function StatCard({ title, value, icon, bgColor, link }: StatCardProps) {
  return (
    <Link href={link}>
      <a className="block">
        <Card className="hover:shadow-md transition duration-200">
          <CardContent className="pt-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${bgColor} rounded-md p-3`}>
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
          <CardFooter className="border-t pt-4 bg-gray-50">
            <div className="text-sm">
              <span className="font-medium text-purple-600 hover:text-purple-500">
                View details <ChevronRight className="inline h-4 w-4" />
              </span>
            </div>
          </CardFooter>
        </Card>
      </a>
    </Link>
  );
}

interface ActivityItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string;
}

function ActivityItem({ icon, title, description, time }: ActivityItemProps) {
  return (
    <div className="flex space-x-3">
      <div className="flex-shrink-0">
        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="flex-shrink-0 self-center">
        <p className="text-xs text-gray-500">{time}</p>
      </div>
    </div>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  link: string;
}

function QuickActionCard({ title, description, icon, link }: QuickActionCardProps) {
  return (
    <Link href={link}>
      <a className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-purple-400 hover:bg-purple-50 focus:outline-none">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
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
}
