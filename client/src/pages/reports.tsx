import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ReportGenerator } from "@/components/reports/report-generator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Student, Progress, TeachingPlan } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("students");

  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/protected/students"],
  });

  // Fetch teaching plans
  const { data: plans, isLoading: isLoadingPlans } = useQuery<TeachingPlan[]>({
    queryKey: ["/api/protected/teaching-plans"],
  });

  // Fetch progress entries
  const { data: progressEntries, isLoading: isLoadingProgress } = useQuery<Progress[]>({
    queryKey: ["/api/protected/progress"],
    queryFn: async () => {
      if (!students) return [];
      
      const allProgress = [];
      
      // For each student, fetch their progress
      for (const student of students) {
        const res = await fetch(`/api/protected/students/${student.id}/progress`, {
          credentials: "include",
        });
        
        if (res.ok) {
          const studentProgress = await res.json();
          allProgress.push(...studentProgress);
        }
      }
      
      return allProgress;
    },
    enabled: !!students,
  });

  // Group progress entries by student ID
  const progressByStudent = progressEntries?.reduce<Record<number, Progress[]>>((acc, entry) => {
    if (!acc[entry.studentId]) {
      acc[entry.studentId] = [];
    }
    acc[entry.studentId].push(entry);
    return acc;
  }, {}) || {};

  const isLoading = isLoadingStudents || isLoadingPlans || isLoadingProgress;

  return (
    <MainLayout title="Reports">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
        <p className="mt-1 text-sm text-gray-500">
          Generate and download student progress and teaching plan reports
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      ) : (
        <Card>
          <CardHeader className="border-b border-gray-200">
            <Tabs defaultValue="students" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="students">Student Progress Reports</TabsTrigger>
                <TabsTrigger value="plans">Teaching Plan Reports</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>

          <CardContent className="p-6">
            <TabsContent value="students" className="mt-0">
              <CardTitle className="text-lg mb-4">Generate Student Progress Report</CardTitle>
              <ReportGenerator 
                type="student"
                students={students || []}
                progressByStudent={progressByStudent}
              />
            </TabsContent>

            <TabsContent value="plans" className="mt-0">
              <CardTitle className="text-lg mb-4">Generate Teaching Plan Report</CardTitle>
              <ReportGenerator 
                type="plan"
                plans={plans || []}
              />
            </TabsContent>
          </CardContent>
        </Card>
      )}
    </MainLayout>
  );
}
