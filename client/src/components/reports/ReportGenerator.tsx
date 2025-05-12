import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Student, Progress, Plan } from "@shared/schema";
import { useReportGenerator } from "@/lib/report-generator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { File, FileSpreadsheet, Download } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type ReportType = "student" | "plan";

interface ReportGeneratorProps {
  onPreviewUpdate: (previewData: any) => void;
}

const ReportGenerator = ({ onPreviewUpdate }: ReportGeneratorProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "admin";
  
  const [reportType, setReportType] = useState<ReportType>("student");
  const [classFilter, setClassFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [includePhotos, setIncludePhotos] = useState(false);
  const [planTypeFilter, setPlanTypeFilter] = useState("all");
  
  const { 
    generateStudentPDF, 
    generateStudentExcel, 
    generatePlanPDF, 
    generatePlanExcel, 
    downloadBlob 
  } = useReportGenerator();
  
  // Fetch teachers for the filter
  const { data: teachers } = useQuery<any[]>({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const response = await fetch("/api/teachers", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch teachers");
      }
      
      return response.json();
    },
    enabled: isAdmin, // Only fetch if user is admin
  });
  
  // Fetch students with progress for report
  const { data: studentsWithProgress } = useQuery<any[]>({
    queryKey: ["/api/reports/students", classFilter, teacherFilter, startDate, endDate],
    queryFn: async ({ queryKey }) => {
      const [_, classFilter, teacherFilter, startDate, endDate] = queryKey;
      
      let url = "/api/reports/students";
      const params = new URLSearchParams();
      
      if (classFilter !== "all") params.append("class", classFilter as string);
      if (teacherFilter !== "all") params.append("teacherId", teacherFilter as string);
      if (startDate) params.append("startDate", startDate as string);
      if (endDate) params.append("endDate", endDate as string);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch students with progress");
      }
      
      return response.json();
    },
    enabled: reportType === "student",
  });
  
  // Fetch plans for report
  const { data: plans } = useQuery<any[]>({
    queryKey: ["/api/reports/plans", classFilter, teacherFilter, planTypeFilter, startDate, endDate],
    queryFn: async ({ queryKey }) => {
      const [_, classFilter, teacherFilter, planTypeFilter, startDate, endDate] = queryKey;
      
      let url = "/api/reports/plans";
      const params = new URLSearchParams();
      
      if (classFilter !== "all") params.append("class", classFilter as string);
      if (teacherFilter !== "all") params.append("teacherId", teacherFilter as string);
      if (planTypeFilter !== "all") params.append("type", planTypeFilter as string);
      if (startDate) params.append("startDate", startDate as string);
      if (endDate) params.append("endDate", endDate as string);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url, {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch plans");
      }
      
      return response.json();
    },
    enabled: reportType === "plan",
  });
  
  // Handle report generation and download
  const handleGenerateReport = async (format: "pdf" | "excel") => {
    try {
      let blob;
      let filename;
      
      const dateString = new Date().toISOString().split('T')[0];
      
      if (reportType === "student") {
        if (!studentsWithProgress || studentsWithProgress.length === 0) {
          toast({
            title: "No data available",
            description: "There are no student records matching your filters.",
            variant: "destructive",
          });
          return;
        }
        
        if (format === "pdf") {
          blob = await generateStudentPDF(studentsWithProgress, {
            includePhotos,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            class: classFilter !== "all" ? classFilter : undefined,
            teacherId: teacherFilter !== "all" ? parseInt(teacherFilter) : undefined,
          });
          
          filename = `student_progress_report_${dateString}.pdf`;
        } else {
          blob = generateStudentExcel(studentsWithProgress, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            class: classFilter !== "all" ? classFilter : undefined,
            teacherId: teacherFilter !== "all" ? parseInt(teacherFilter) : undefined,
          });
          
          filename = `student_progress_report_${dateString}.xlsx`;
        }
      } else {
        if (!plans || plans.length === 0) {
          toast({
            title: "No data available",
            description: "There are no teaching plans matching your filters.",
            variant: "destructive",
          });
          return;
        }
        
        if (format === "pdf") {
          blob = await generatePlanPDF(plans, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            class: classFilter !== "all" ? classFilter : undefined,
            teacherId: teacherFilter !== "all" ? parseInt(teacherFilter) : undefined,
          });
          
          filename = `teaching_plans_report_${dateString}.pdf`;
        } else {
          blob = generatePlanExcel(plans, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            class: classFilter !== "all" ? classFilter : undefined,
            teacherId: teacherFilter !== "all" ? parseInt(teacherFilter) : undefined,
          });
          
          filename = `teaching_plans_report_${dateString}.xlsx`;
        }
      }
      
      // Download the generated report
      downloadBlob(blob, filename);
      
      toast({
        title: "Report generated",
        description: `Your ${reportType} report has been downloaded.`,
      });
      
      // Update the preview
      onPreviewUpdate(reportType === "student" ? studentsWithProgress : plans);
      
    } catch (error) {
      toast({
        title: "Failed to generate report",
        description: error instanceof Error ? error.message : "An error occurred while generating the report.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Reports</CardTitle>
        <CardDescription>Create and download student progress and teaching plan reports</CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={reportType} onValueChange={(value) => setReportType(value as ReportType)} className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="student" className="flex-1">Student Progress Reports</TabsTrigger>
            <TabsTrigger value="plan" className="flex-1">Teaching Plan Reports</TabsTrigger>
          </TabsList>
          
          <TabsContent value="student">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <Label htmlFor="report-class">Class</Label>
                <Select 
                  value={classFilter} 
                  onValueChange={setClassFilter}
                >
                  <SelectTrigger id="report-class" className="mt-1">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="nursery">Nursery</SelectItem>
                    <SelectItem value="lkg">LKG</SelectItem>
                    <SelectItem value="ukg">UKG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {isAdmin && (
                <div className="sm:col-span-3">
                  <Label htmlFor="report-teacher">Teacher</Label>
                  <Select 
                    value={teacherFilter} 
                    onValueChange={setTeacherFilter}
                  >
                    <SelectTrigger id="report-teacher" className="mt-1">
                      <SelectValue placeholder="All Teachers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers?.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="sm:col-span-3">
                <Label htmlFor="report-start-date">From Date</Label>
                <Input
                  type="date"
                  id="report-start-date"
                  className="mt-1"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div className="sm:col-span-3">
                <Label htmlFor="report-end-date">To Date</Label>
                <Input
                  type="date"
                  id="report-end-date"
                  className="mt-1"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              
              <div className="sm:col-span-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-photos"
                    checked={includePhotos}
                    onCheckedChange={(checked) => setIncludePhotos(checked === true)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="include-photos" className="font-medium text-gray-700">
                      Include student photos in report
                    </Label>
                    <p className="text-sm text-gray-500">Photos will be included in the PDF report only</p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="plan">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <Label htmlFor="plan-type-report">Plan Type</Label>
                <Select 
                  value={planTypeFilter} 
                  onValueChange={setPlanTypeFilter}
                >
                  <SelectTrigger id="plan-type-report" className="mt-1">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="sm:col-span-2">
                <Label htmlFor="plan-class-report">Class</Label>
                <Select 
                  value={classFilter} 
                  onValueChange={setClassFilter}
                >
                  <SelectTrigger id="plan-class-report" className="mt-1">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="nursery">Nursery</SelectItem>
                    <SelectItem value="lkg">LKG</SelectItem>
                    <SelectItem value="ukg">UKG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {isAdmin && (
                <div className="sm:col-span-2">
                  <Label htmlFor="plan-teacher-report">Teacher</Label>
                  <Select 
                    value={teacherFilter} 
                    onValueChange={setTeacherFilter}
                  >
                    <SelectTrigger id="plan-teacher-report" className="mt-1">
                      <SelectValue placeholder="All Teachers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers?.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="sm:col-span-3">
                <Label htmlFor="plan-start-date">From Date</Label>
                <Input
                  type="date"
                  id="plan-start-date"
                  className="mt-1"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              
              <div className="sm:col-span-3">
                <Label htmlFor="plan-end-date">To Date</Label>
                <Input
                  type="date"
                  id="plan-end-date"
                  className="mt-1"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {reportType === "student" 
              ? "Reports will include student details and progress history" 
              : "Reports will include teaching plan details"}
          </span>
          
          <div className="flex space-x-3">
            <Button
              onClick={() => handleGenerateReport("pdf")}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <File className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button
              variant="outline"
              onClick={() => handleGenerateReport("excel")}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Download Excel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;
