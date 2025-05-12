import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportGenerator } from "@/components/reports/report-generator";
import { useToast } from "@/hooks/use-toast";

export default function ReportsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"student-progress" | "teaching-plan">("student-progress");
  
  // Get teachers for filter
  const { data: teachers } = useQuery<User[]>({
    queryKey: ["/api/teachers"],
    enabled: user?.role === "admin", // Only fetch if user is admin
  });
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setActiveTab(value as "student-progress" | "teaching-plan");
  };
  
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        <TopBar title="Reports" />
        
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none p-6">
          <div className="max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
              <p className="mt-1 text-sm text-gray-500">Generate and download student progress and teaching plan reports</p>
            </div>
            
            {/* Report Types Tabs */}
            <Card className="shadow rounded-lg mb-6">
              <Tabs defaultValue="student-progress" onValueChange={handleTabChange}>
                <CardHeader className="border-b border-gray-200 px-0 py-0">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="student-progress" className="py-4 px-1 text-center rounded-none">
                      Student Progress Reports
                    </TabsTrigger>
                    <TabsTrigger value="teaching-plan" className="py-4 px-1 text-center rounded-none">
                      Teaching Plan Reports
                    </TabsTrigger>
                  </TabsList>
                </CardHeader>
                
                <CardContent className="p-6">
                  {/* Student Progress Report Generator */}
                  <TabsContent value="student-progress">
                    <ReportGenerator
                      type="student-progress"
                      title="Generate Student Progress Report"
                      teachers={teachers}
                      isAdmin={user?.role === "admin"}
                    />
                  </TabsContent>
                  
                  {/* Teaching Plan Report Generator */}
                  <TabsContent value="teaching-plan">
                    <ReportGenerator
                      type="teaching-plan"
                      title="Generate Teaching Plan Report"
                      teachers={teachers}
                      isAdmin={user?.role === "admin"}
                    />
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
            
            {/* Report Preview */}
            <Card className="shadow rounded-lg">
              <CardHeader className="px-6 py-4 border-b border-gray-200">
                <CardTitle className="text-lg font-medium text-gray-900">Report Preview</CardTitle>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-purple-800">Nepal Central High School</h1>
                    <h2 className="text-lg font-medium text-gray-700">
                      {activeTab === "student-progress" ? "Student Progress Report" : "Teaching Plan Report"}
                    </h2>
                    <p className="text-sm text-gray-500">Narephat, Kathmandu</p>
                  </div>
                  
                  <div className="mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Class</h3>
                        <p className="mt-1 text-base text-gray-900">All Classes</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 uppercase">Date Range</h3>
                        <p className="mt-1 text-base text-gray-900">{new Date().toLocaleDateString()} to {new Date().toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  {activeTab === "student-progress" ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                            <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learning Ability</th>
                            <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Writing Speed</th>
                            <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Social Skills</th>
                            <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pre-Literacy</th>
                            <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pre-Numeracy</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Sample Student</td>
                            <td className="px-6 py-4 text-sm text-gray-500">Talented</td>
                            <td className="px-6 py-4 text-sm text-gray-500">Speed Writing</td>
                            <td className="px-6 py-4 text-sm text-gray-500">Excellent</td>
                            <td className="px-6 py-4 text-sm text-gray-500">Excellent</td>
                            <td className="px-6 py-4 text-sm text-gray-500">Excellent</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Sample Student 2</td>
                            <td className="px-6 py-4 text-sm text-gray-500">Average</td>
                            <td className="px-6 py-4 text-sm text-gray-500">Average</td>
                            <td className="px-6 py-4 text-sm text-gray-500">Good</td>
                            <td className="px-6 py-4 text-sm text-gray-500">Good</td>
                            <td className="px-6 py-4 text-sm text-gray-500">Good</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                            <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                            <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                            <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Annual Learning Goals</td>
                            <td className="px-6 py-4 text-sm text-gray-500">Annual</td>
                            <td className="px-6 py-4 text-sm text-gray-500">UKG</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date().toLocaleDateString()} - {new Date().toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">Teacher Name</td>
                          </tr>
                          <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Monthly Activities</td>
                            <td className="px-6 py-4 text-sm text-gray-500">Monthly</td>
                            <td className="px-6 py-4 text-sm text-gray-500">LKG</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {new Date().toLocaleDateString()} - {new Date().toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">Teacher Name</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                  
                  <div className="mt-6 text-sm text-gray-500 text-right">
                    <p>Generated on: {new Date().toLocaleDateString()}</p>
                    <p>System: Pre-Primary Student Record-Keeping System</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
