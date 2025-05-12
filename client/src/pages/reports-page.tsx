import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { ReportGenerator } from '@/components/reports/report-generator';
import { useAuth } from '@/hooks/use-auth';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("student");
  
  // Fetch students data
  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students'],
    retry: false,
  });

  // Fetch teachers data (admin only)
  const { data: teachers, isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/teachers'],
    enabled: user?.role === 'admin',
    retry: false,
  });

  // Fetch plans data
  const { data: plans, isLoading: plansLoading } = useQuery({
    queryKey: ['/api/plans'],
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Reports" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
            <p className="mt-1 text-sm text-gray-500">Generate and download student progress and teaching plan reports</p>
          </div>
          
          {/* Report Types Tabs */}
          <div className="bg-white shadow rounded-lg mb-6">
            <Tabs defaultValue="student" value={activeTab} onValueChange={setActiveTab}>
              <div className="border-b border-gray-200">
                <TabsList className="w-full">
                  <TabsTrigger value="student" className="w-1/2 py-4 px-1 text-center">
                    Student Progress Reports
                  </TabsTrigger>
                  <TabsTrigger value="plan" className="w-1/2 py-4 px-1 text-center">
                    Teaching Plan Reports
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-6">
                {/* Student Progress Report Generator */}
                <TabsContent value="student">
                  <ReportGenerator
                    type="student"
                    students={students || []}
                    teachers={teachers || []}
                    plans={[]}
                    isLoading={studentsLoading || teachersLoading}
                  />
                </TabsContent>
                
                {/* Teaching Plan Report Generator */}
                <TabsContent value="plan">
                  <ReportGenerator
                    type="plan"
                    students={[]}
                    teachers={teachers || []}
                    plans={plans || []}
                    isLoading={plansLoading || teachersLoading}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>
          
          {/* Report Preview */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Report Preview</h3>
            </div>
            
            <div className="p-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="text-center mb-6">
                  <h1 className="text-2xl font-bold text-purple-800">Nepal Central High School</h1>
                  <h2 className="text-lg font-medium text-gray-700">
                    {activeTab === 'student' ? 'Student Progress Report' : 'Teaching Plan Report'}
                  </h2>
                  <p className="text-sm text-gray-500">Narephat, Kathmandu</p>
                </div>
                
                <div className="mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase">Class</h3>
                      <p className="mt-1 text-base text-gray-900">UKG</p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 uppercase">Date Range</h3>
                      <p className="mt-1 text-base text-gray-900">{new Date().toISOString().split('T')[0]} to {new Date().toISOString().split('T')[0]}</p>
                    </div>
                  </div>
                </div>
                
                {activeTab === 'student' ? (
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
                        {studentsLoading ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                              Loading student data...
                            </td>
                          </tr>
                        ) : students && students.length > 0 ? (
                          students.slice(0, 3).map((student: any) => (
                            <tr key={student.id}>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{student.learningAbility}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{student.writingSpeed || 'N/A'}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Good</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Excellent</td>
                              <td className="px-6 py-4 text-sm text-gray-500">Good</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                              No student data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Title</th>
                          <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                          <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                          <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                          <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {plansLoading ? (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                              Loading plan data...
                            </td>
                          </tr>
                        ) : plans && plans.length > 0 ? (
                          plans.slice(0, 3).map((plan: any) => (
                            <tr key={plan.id}>
                              <td className="px-6 py-4 text-sm font-medium text-gray-900">{plan.title}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{plan.type}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">{plan.class}</td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500">
                                {teachers?.find((t: any) => t.id === plan.createdBy)?.name || 'Unknown'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                              No plan data available
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                
                <div className="mt-6 text-sm text-gray-500 text-right">
                  <p>Generated on: {new Date().toLocaleDateString()}</p>
                  <p>System: Pre-Primary Student Record-Keeping System</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
