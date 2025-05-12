import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Student, Progress, TeachingPlan } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { generatePDF } from "@/lib/pdf-generator";
import { generateExcel } from "@/lib/excel-generator";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { 
  FileText, 
  FileSpreadsheet, 
  CalendarIcon, 
  Check,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export function ReportGenerator() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  
  // Student report state
  const [reportClass, setReportClass] = useState<string>("all");
  const [reportTeacher, setReportTeacher] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().getFullYear(), 0, 1)); // Jan 1 of current year
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [includePhotos, setIncludePhotos] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Plan report state
  const [planType, setPlanType] = useState<string>("all");
  const [planClass, setPlanClass] = useState<string>("all");
  const [planTeacher, setPlanTeacher] = useState<string>("all");
  const [isGeneratingPlanReport, setIsGeneratingPlanReport] = useState(false);
  
  // Fetch teachers for filtering (admin only)
  const { data: teachers } = useQuery({
    queryKey: ['/api/teachers'],
    enabled: isAdmin,
  });
  
  // Fetch students
  const { data: students } = useQuery<Student[]>({
    queryKey: [
      '/api/students', 
      reportClass !== "all" ? reportClass : undefined,
      isAdmin && reportTeacher !== "all" ? parseInt(reportTeacher) : undefined,
    ],
  });
  
  // Fetch progress entries
  const { data: progressEntries } = useQuery<Progress[]>({
    queryKey: ['/api/progress'],
  });
  
  // Fetch teaching plans
  const { data: teachingPlans } = useQuery<TeachingPlan[]>({
    queryKey: [
      '/api/teaching-plans',
      planType !== "all" ? planType : undefined,
      planClass !== "all" ? planClass : undefined,
      isAdmin && planTeacher !== "all" ? parseInt(planTeacher) : undefined,
    ],
  });
  
  // Generate student progress report
  const generateStudentReport = async (format: 'pdf' | 'excel') => {
    if (!students || !progressEntries) {
      toast({
        title: "Error",
        description: "Unable to generate report. Data is not available.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Set generating state based on format
      setIsGenerating(true);
      
      // Filter data
      let filteredStudents = students;
      if (reportClass !== "all") {
        filteredStudents = filteredStudents.filter(s => s.class === reportClass);
      }
      if (isAdmin && reportTeacher !== "all") {
        filteredStudents = filteredStudents.filter(s => s.teacherId === parseInt(reportTeacher));
      }
      
      let filteredProgress = progressEntries;
      if (startDate && endDate) {
        filteredProgress = filteredProgress.filter(p => {
          const progressDate = new Date(p.date);
          return progressDate >= startDate && progressDate <= endDate;
        });
      }
      
      // Prepare data for report
      const reportData = filteredStudents.map(student => {
        const studentProgress = filteredProgress.filter(p => p.studentId === student.id);
        return {
          ...student,
          progress: studentProgress,
        };
      });
      
      // Generate report based on format
      if (format === 'pdf') {
        await generatePDF({
          type: 'student',
          data: reportData,
          options: {
            title: 'Student Progress Report',
            dateRange: {
              start: startDate,
              end: endDate,
            },
            includePhotos,
          },
        });
      } else {
        await generateExcel({
          type: 'student',
          data: reportData,
          options: {
            title: 'Student Progress Report',
            dateRange: {
              start: startDate,
              end: endDate,
            },
          },
        });
      }
      
      toast({
        title: "Report Generated",
        description: `Student progress report has been generated as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to generate ${format.toUpperCase()} report: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Generate teaching plan report
  const generatePlanReport = async (format: 'pdf' | 'excel') => {
    if (!teachingPlans) {
      toast({
        title: "Error",
        description: "Unable to generate report. Data is not available.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Set generating state
      setIsGeneratingPlanReport(true);
      
      // Filter teaching plans
      let filteredPlans = teachingPlans;
      if (planType !== "all") {
        filteredPlans = filteredPlans.filter(p => p.type === planType);
      }
      if (planClass !== "all") {
        filteredPlans = filteredPlans.filter(p => p.class === planClass);
      }
      if (isAdmin && planTeacher !== "all") {
        filteredPlans = filteredPlans.filter(p => p.teacherId === parseInt(planTeacher));
      }
      
      // Generate report based on format
      if (format === 'pdf') {
        await generatePDF({
          type: 'plan',
          data: filteredPlans,
          options: {
            title: 'Teaching Plans Report',
          },
        });
      } else {
        await generateExcel({
          type: 'plan',
          data: filteredPlans,
          options: {
            title: 'Teaching Plans Report',
          },
        });
      }
      
      toast({
        title: "Report Generated",
        description: `Teaching plans report has been generated as ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to generate ${format.toUpperCase()} report: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPlanReport(false);
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg mb-6">
      <Tabs defaultValue="student">
        <div className="border-b border-gray-200">
          <TabsList className="w-full bg-transparent">
            <TabsTrigger value="student" className="w-1/2 py-4 px-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:text-purple-600">
              Student Progress Reports
            </TabsTrigger>
            <TabsTrigger value="plan" className="w-1/2 py-4 px-1 data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:text-purple-600">
              Teaching Plan Reports
            </TabsTrigger>
          </TabsList>
        </div>
        
        <div className="p-6">
          <TabsContent value="student" className="mt-0">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Student Progress Report</h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <Label htmlFor="report-class">Class</Label>
                <Select
                  value={reportClass}
                  onValueChange={setReportClass}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="Nursery">Nursery</SelectItem>
                    <SelectItem value="LKG">LKG</SelectItem>
                    <SelectItem value="UKG">UKG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {isAdmin && (
                <div className="sm:col-span-3">
                  <Label htmlFor="report-teacher">Teacher</Label>
                  <Select
                    value={reportTeacher}
                    onValueChange={setReportTeacher}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All Teachers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers?.map(teacher => (
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
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full mt-1 justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="sm:col-span-3">
                <Label htmlFor="report-end-date">To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full mt-1 justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) =>
                        startDate ? date < startDate : false
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="sm:col-span-6">
                <div className="relative flex items-start">
                  <div className="flex h-5 items-center">
                    <Checkbox 
                      id="include-photos" 
                      checked={includePhotos}
                      onCheckedChange={(checked) => setIncludePhotos(checked as boolean)}
                    />
                  </div>
                  <div className="ml-3">
                    <Label 
                      htmlFor="include-photos" 
                      className="font-medium text-gray-700"
                    >
                      Include student photos in report
                    </Label>
                    <p className="text-sm text-gray-500">Photos will be included in the PDF report only</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-gray-500">Reports will include student details and progress history</span>
              
              <div className="flex space-x-3">
                <Button
                  variant="default"
                  onClick={() => generateStudentReport('pdf')}
                  disabled={isGenerating}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  {isGenerating ? "Generating..." : "Download PDF"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generateStudentReport('excel')}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                  )}
                  {isGenerating ? "Generating..." : "Download Excel"}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="plan" className="mt-0">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Teaching Plan Report</h3>
            
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <Label htmlFor="plan-type-report">Plan Type</Label>
                <Select
                  value={planType}
                  onValueChange={setPlanType}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="sm:col-span-2">
                <Label htmlFor="plan-class-report">Class</Label>
                <Select
                  value={planClass}
                  onValueChange={setPlanClass}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    <SelectItem value="Nursery">Nursery</SelectItem>
                    <SelectItem value="LKG">LKG</SelectItem>
                    <SelectItem value="UKG">UKG</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {isAdmin && (
                <div className="sm:col-span-2">
                  <Label htmlFor="plan-teacher-report">Teacher</Label>
                  <Select
                    value={planTeacher}
                    onValueChange={setPlanTeacher}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="All Teachers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers?.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-gray-500">Reports will include teaching plan details including activities and goals</span>
              
              <div className="flex space-x-3">
                <Button
                  variant="default"
                  onClick={() => generatePlanReport('pdf')}
                  disabled={isGeneratingPlanReport}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isGeneratingPlanReport ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="mr-2 h-4 w-4" />
                  )}
                  {isGeneratingPlanReport ? "Generating..." : "Download PDF"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => generatePlanReport('excel')}
                  disabled={isGeneratingPlanReport}
                >
                  {isGeneratingPlanReport ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                  )}
                  {isGeneratingPlanReport ? "Generating..." : "Download Excel"}
                </Button>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
