import { useState } from "react";
import { MainLayout } from "@/layouts/MainLayout";
import ReportGenerator from "@/components/reports/ReportGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<string>("students");
  const { user } = useAuth();

  return (
    <MainLayout title="Reports">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <p className="mt-1 text-sm text-gray-500">Generate and download student progress and teaching plan reports</p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full border-b border-gray-200 bg-white shadow rounded-t-lg">
          <TabsTrigger 
            value="students" 
            className="flex-1 py-4 px-1 text-center data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:font-medium data-[state=active]:text-purple-600"
          >
            Student Progress Reports
          </TabsTrigger>
          <TabsTrigger 
            value="plans"
            className="flex-1 py-4 px-1 text-center data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:font-medium data-[state=active]:text-purple-600"
          >
            Teaching Plan Reports
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="students" className="mt-0">
          <Card className="shadow rounded-b-lg rounded-t-none">
            <CardContent className="p-6">
              <ReportGenerator 
                type="students" 
                userRole={user?.role || "teacher"} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="plans" className="mt-0">
          <Card className="shadow rounded-b-lg rounded-t-none">
            <CardContent className="p-6">
              <ReportGenerator 
                type="plans" 
                userRole={user?.role || "teacher"} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card className="mt-6 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Report Preview</h3>
        </div>
        
        <CardContent className="p-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-purple-800">Nepal Central High School</h1>
              <h2 className="text-lg font-medium text-gray-700">
                {activeTab === "students" ? "Student Progress Report" : "Teaching Plan Report"}
              </h2>
              <p className="text-sm text-gray-500">Narephat, Kathmandu</p>
            </div>
            
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Class</h3>
                  <p className="mt-1 text-base text-gray-900">
                    {activeTab === "students" ? "UKG" : "All Classes"}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 uppercase">Date Range</h3>
                  <p className="mt-1 text-base text-gray-900">2023-01-01 to 2023-10-01</p>
                </div>
              </div>
            </div>
            
            {activeTab === "students" ? (
              // Student progress report preview
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
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Arjun Thapa</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Talented</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Speed Writing</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Excellent</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Excellent</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Excellent</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Meera Tamang</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Average</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Average</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Good</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Good</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Good</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Bijay Rai</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Slow Learner</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Slow Writing</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Needs Improvement</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Needs Improvement</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Good</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              // Teaching plans report preview
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Type</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start Date</th>
                      <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End Date</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-500">Annual</td>
                      <td className="px-6 py-4 text-sm text-gray-500">UKG</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">School Readiness Program</td>
                      <td className="px-6 py-4 text-sm text-gray-500">2023-01-01</td>
                      <td className="px-6 py-4 text-sm text-gray-500">2023-12-31</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-500">Monthly</td>
                      <td className="px-6 py-4 text-sm text-gray-500">LKG</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">October Counting & Colors</td>
                      <td className="px-6 py-4 text-sm text-gray-500">2023-10-01</td>
                      <td className="px-6 py-4 text-sm text-gray-500">2023-10-31</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-500">Weekly</td>
                      <td className="px-6 py-4 text-sm text-gray-500">Nursery</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Farm Animals Week</td>
                      <td className="px-6 py-4 text-sm text-gray-500">2023-10-02</td>
                      <td className="px-6 py-4 text-sm text-gray-500">2023-10-06</td>
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
    </MainLayout>
  );
}
