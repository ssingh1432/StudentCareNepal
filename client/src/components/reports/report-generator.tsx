import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Student, ProgressEntry, TeachingPlan } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  generateStudentPDF, 
  generateStudentExcel, 
  generateTeachingPlanPDF, 
  generateTeachingPlanExcel 
} from "@/lib/reports";
import { apiRequest } from "@/lib/queryClient";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { File, FileSpreadsheet, Download, AlertCircle } from "lucide-react";

// Form schema for student report
const studentReportSchema = z.object({
  class: z.string(),
  teacherId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  includePhotos: z.boolean().default(true),
});

// Form schema for plan report
const planReportSchema = z.object({
  class: z.string(),
  type: z.string(),
  teacherId: z.string().optional(),
});

type StudentReportValues = z.infer<typeof studentReportSchema>;
type PlanReportValues = z.infer<typeof planReportSchema>;

export default function ReportGenerator() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  const [activeTab, setActiveTab] = useState<string>("students");
  const [generatingReport, setGeneratingReport] = useState<boolean>(false);
  
  // Student report form
  const studentForm = useForm<StudentReportValues>({
    resolver: zodResolver(studentReportSchema),
    defaultValues: {
      class: "all",
      teacherId: "all",
      startDate: undefined,
      endDate: undefined,
      includePhotos: true,
    },
  });
  
  // Plan report form
  const planForm = useForm<PlanReportValues>({
    resolver: zodResolver(planReportSchema),
    defaultValues: {
      class: "all",
      type: "all",
      teacherId: "all",
    },
  });
  
  // Fetch teachers (for admin)
  const { data: teachers = [] } = useQuery({
    queryKey: ["/api/teachers"],
    enabled: isAdmin,
  });
  
  // Fetch students based on filters
  const {
    data: students = [],
    isLoading: isLoadingStudents,
    isError: isErrorStudents,
    refetch: refetchStudents,
  } = useQuery({
    queryKey: [
      "/api/students",
      studentForm.watch("class"),
      studentForm.watch("teacherId"),
    ],
    queryFn: async ({ queryKey }) => {
      const [_, classFilter, teacherId] = queryKey as string[];
      let url = "/api/students";
      
      const params = new URLSearchParams();
      if (classFilter !== "all") params.append("class", classFilter);
      if (teacherId !== "all" && teacherId) params.append("teacherId", teacherId);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await apiRequest("GET", url);
      return await res.json() as Student[];
    },
  });
  
  // Fetch plans based on filters
  const {
    data: plans = [],
    isLoading: isLoadingPlans,
    isError: isErrorPlans,
    refetch: refetchPlans,
  } = useQuery({
    queryKey: [
      "/api/plans",
      planForm.watch("class"),
      planForm.watch("type"),
    ],
    queryFn: async ({ queryKey }) => {
      const [_, classFilter, typeFilter] = queryKey as string[];
      let url = "/api/plans";
      
      const params = new URLSearchParams();
      if (classFilter !== "all") params.append("class", classFilter);
      if (typeFilter !== "all") params.append("type", typeFilter);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await apiRequest("GET", url);
      return await res.json() as TeachingPlan[];
    },
  });
  
  // Function to fetch progress entries for student(s)
  const fetchProgressEntries = async (studentIds: number[]): Promise<{[studentId: number]: ProgressEntry[]}> => {
    const progressMap: {[studentId: number]: ProgressEntry[]} = {};
    
    // Fetch progress entries for each student in parallel
    await Promise.all(
      studentIds.map(async (studentId) => {
        try {
          const res = await apiRequest("GET", `/api/progress?studentId=${studentId}`);
          const entries = await res.json() as ProgressEntry[];
          
          // Filter by date range if provided
          const startDate = studentForm.watch("startDate");
          const endDate = studentForm.watch("endDate");
          
          let filteredEntries = entries;
          
          if (startDate) {
            const startTimestamp = new Date(startDate).getTime();
            filteredEntries = filteredEntries.filter(
              (entry) => new Date(entry.date).getTime() >= startTimestamp
            );
          }
          
          if (endDate) {
            const endTimestamp = new Date(endDate).getTime();
            filteredEntries = filteredEntries.filter(
              (entry) => new Date(entry.date).getTime() <= endTimestamp
            );
          }
          
          progressMap[studentId] = filteredEntries;
        } catch (error) {
          console.error(`Error fetching progress for student ${studentId}:`, error);
          progressMap[studentId] = [];
        }
      })
    );
    
    return progressMap;
  };
  
  // Function to generate and download student report
  const generateStudentReport = async (format: 'pdf' | 'excel') => {
    try {
      setGeneratingReport(true);
      
      // Get filtered students
      const filteredStudents = [...students];
      
      // No students to generate report for
      if (filteredStudents.length === 0) {
        toast({
          title: "No Data",
          description: "There are no students matching your filters to generate a report for.",
          variant: "destructive",
        });
        return;
      }
      
      // Fetch progress for all students
      const progressEntries = await fetchProgressEntries(filteredStudents.map(s => s.id));
      
      // Generate report based on format
      let reportBlob: Blob;
      let fileName: string;
      
      if (format === 'pdf') {
        reportBlob = await generateStudentPDF(
          filteredStudents, 
          progressEntries, 
          studentForm.watch("includePhotos")
        );
        fileName = `student_progress_report_${new Date().toISOString().split('T')[0]}.pdf`;
      } else {
        reportBlob = await generateStudentExcel(filteredStudents, progressEntries);
        fileName = `student_progress_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      }
      
      // Create download link
      const url = URL.createObjectURL(reportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Report Generated",
        description: `Your ${format.toUpperCase()} report has been downloaded.`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: `Failed to generate ${format.toUpperCase()} report. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(false);
    }
  };
  
  // Function to generate and download teaching plan report
  const generatePlanReport = async (format: 'pdf' | 'excel') => {
    try {
      setGeneratingReport(true);
      
      // Get filtered plans
      const filteredPlans = [...plans];
      
      // No plans to generate report for
      if (filteredPlans.length === 0) {
        toast({
          title: "No Data",
          description: "There are no teaching plans matching your filters to generate a report for.",
          variant: "destructive",
        });
        return;
      }
      
      // Generate report based on format
      let reportBlob: Blob;
      let fileName: string;
      
      if (format === 'pdf') {
        reportBlob = await generateTeachingPlanPDF(filteredPlans);
        fileName = `teaching_plan_report_${new Date().toISOString().split('T')[0]}.pdf`;
      } else {
        reportBlob = await generateTeachingPlanExcel(filteredPlans);
        fileName = `teaching_plan_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      }
      
      // Create download link
      const url = URL.createObjectURL(reportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Report Generated",
        description: `Your ${format.toUpperCase()} report has been downloaded.`,
      });
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: `Failed to generate ${format.toUpperCase()} report. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setGeneratingReport(false);
    }
  };
  
  const handleStudentReportSubmit = async (values: StudentReportValues, format: 'pdf' | 'excel') => {
    await generateStudentReport(format);
  };
  
  const handlePlanReportSubmit = async (values: PlanReportValues, format: 'pdf' | 'excel') => {
    await generatePlanReport(format);
  };
  
  // Display error messages if data fetching fails
  if (isErrorStudents && activeTab === "students") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold">Error Loading Students</h3>
            <p className="text-sm text-gray-500 mt-2">
              There was a problem loading the student data. Please try again later.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => refetchStudents()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isErrorPlans && activeTab === "plans") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold">Error Loading Plans</h3>
            <p className="text-sm text-gray-500 mt-2">
              There was a problem loading the teaching plan data. Please try again later.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => refetchPlans()}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Reports</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="students">Student Progress Reports</TabsTrigger>
            <TabsTrigger value="plans">Teaching Plan Reports</TabsTrigger>
          </TabsList>
          
          {/* Student Progress Report Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Generate Student Progress Report</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingStudents ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <Form {...studentForm}>
                    <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={studentForm.control}
                          name="class"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Class</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="All Classes" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="all">All Classes</SelectItem>
                                  <SelectItem value="Nursery">Nursery</SelectItem>
                                  <SelectItem value="LKG">LKG</SelectItem>
                                  <SelectItem value="UKG">UKG</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {isAdmin && (
                          <FormField
                            control={studentForm.control}
                            name="teacherId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Teacher</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="All Teachers" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="all">All Teachers</SelectItem>
                                    {teachers.map((teacher: any) => (
                                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                        {teacher.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                        
                        <FormField
                          control={studentForm.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>From Date (Optional)</FormLabel>
                              <FormControl>
                                <input
                                  type="date"
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={studentForm.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>To Date (Optional)</FormLabel>
                              <FormControl>
                                <input
                                  type="date"
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={studentForm.control}
                        name="includePhotos"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Include student photos in report</FormLabel>
                              <p className="text-sm text-muted-foreground">
                                Photos will be included in the PDF report only
                              </p>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <div className="mt-6 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Reports will include student details and progress history
                        </span>
                        
                        <div className="flex space-x-3">
                          <Button
                            type="button"
                            onClick={() => handleStudentReportSubmit(studentForm.getValues(), 'pdf')}
                            disabled={generatingReport}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {generatingReport ? (
                              <>
                                <Download className="h-4 w-4 mr-2 animate-pulse" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <File className="h-4 w-4 mr-2" />
                                Download PDF
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleStudentReportSubmit(studentForm.getValues(), 'excel')}
                            disabled={generatingReport}
                          >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Download Excel
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
            
            {/* Report Preview Card - can be implemented based on needs */}
          </TabsContent>
          
          {/* Teaching Plan Report Tab */}
          <TabsContent value="plans">
            <Card>
              <CardHeader>
                <CardTitle>Generate Teaching Plan Report</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPlans ? (
                  <div className="space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : (
                  <Form {...planForm}>
                    <form className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FormField
                          control={planForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Plan Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="All Types" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="all">All Types</SelectItem>
                                  <SelectItem value="Annual">Annual</SelectItem>
                                  <SelectItem value="Monthly">Monthly</SelectItem>
                                  <SelectItem value="Weekly">Weekly</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={planForm.control}
                          name="class"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Class</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="All Classes" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="all">All Classes</SelectItem>
                                  <SelectItem value="Nursery">Nursery</SelectItem>
                                  <SelectItem value="LKG">LKG</SelectItem>
                                  <SelectItem value="UKG">UKG</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {isAdmin && (
                          <FormField
                            control={planForm.control}
                            name="teacherId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Teacher</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="All Teachers" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="all">All Teachers</SelectItem>
                                    {teachers.map((teacher: any) => (
                                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                        {teacher.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                      
                      <div className="mt-6 flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          Reports will include teaching plan details, activities, and goals
                        </span>
                        
                        <div className="flex space-x-3">
                          <Button
                            type="button"
                            onClick={() => handlePlanReportSubmit(planForm.getValues(), 'pdf')}
                            disabled={generatingReport}
                            className="bg-purple-600 hover:bg-purple-700"
                          >
                            {generatingReport ? (
                              <>
                                <Download className="h-4 w-4 mr-2 animate-pulse" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <File className="h-4 w-4 mr-2" />
                                Download PDF
                              </>
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handlePlanReportSubmit(planForm.getValues(), 'excel')}
                            disabled={generatingReport}
                          >
                            <FileSpreadsheet className="h-4 w-4 mr-2" />
                            Download Excel
                          </Button>
                        </div>
                      </div>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
