import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Loader2, FileText, FileSpreadsheet, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { classLevels, planTypes } from "@shared/schema";
import { generatePdf } from "@/lib/pdf-generator";
import { generateExcel } from "@/lib/excel-generator";
import { useToast } from "@/hooks/use-toast";

export function ReportGenerator() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<string>("students");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [planTypeFilter, setPlanTypeFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | undefined>(
    new Date(new Date().getFullYear(), 0, 1) // January 1st of current year
  );
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [includePhotos, setIncludePhotos] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Query to fetch teachers for the admin filter
  const { data: teachers, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['/api/teachers'],
    enabled: isAdmin, // Only load if admin
  });

  // Query to fetch report preview data
  const { data: previewData, isLoading: isLoadingPreview } = useQuery({
    queryKey: [
      '/api/reports/preview',
      {
        type: activeTab,
        classFilter,
        teacherFilter,
        planTypeFilter,
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        endDate: endDate ? format(endDate, 'yyyy-MM-dd') : undefined,
      }
    ],
  });

  const handleGeneratePdf = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Missing date range",
        description: "Please select both start and end dates for the report.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      await generatePdf({
        type: activeTab,
        classFilter,
        teacherFilter,
        planTypeFilter,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
        includePhotos,
      });

      toast({
        title: "Success",
        description: "PDF report has been generated and downloaded.",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF report. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateExcel = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Missing date range",
        description: "Please select both start and end dates for the report.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      await generateExcel({
        type: activeTab,
        classFilter,
        teacherFilter,
        planTypeFilter,
        startDate: format(startDate, 'yyyy-MM-dd'),
        endDate: format(endDate, 'yyyy-MM-dd'),
      });

      toast({
        title: "Success",
        description: "Excel report has been generated and downloaded.",
      });
    } catch (error) {
      console.error("Excel generation error:", error);
      toast({
        title: "Error",
        description: "Failed to generate Excel report. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Reports</CardTitle>
        <CardDescription>
          Create PDF or Excel reports for students' progress and teaching plans
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="students" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="students">Student Progress Reports</TabsTrigger>
            <TabsTrigger value="plans">Teaching Plan Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="report-class">Class</Label>
                <Select
                  value={classFilter}
                  onValueChange={setClassFilter}
                >
                  <SelectTrigger id="report-class" className="mt-1">
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classLevels.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isAdmin && (
                <div>
                  <Label htmlFor="report-teacher">Teacher</Label>
                  <Select
                    value={teacherFilter}
                    onValueChange={setTeacherFilter}
                  >
                    <SelectTrigger id="report-teacher" className="mt-1">
                      <SelectValue placeholder="Filter by teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers?.map((teacher: any) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full mt-1 justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      {startDate ? (
                        format(startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
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

              <div>
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full mt-1 justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      {endDate ? (
                        format(endDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="md:col-span-2 lg:col-span-3 flex items-center space-x-2">
                <Checkbox 
                  id="include-photos" 
                  checked={includePhotos} 
                  onCheckedChange={(checked) => setIncludePhotos(checked as boolean)}
                />
                <div className="grid gap-1.5 leading-none">
                  <Label htmlFor="include-photos">Include student photos in report</Label>
                  <p className="text-sm text-muted-foreground">
                    Photos will be included in the PDF report only
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="plans" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="plan-type">Plan Type</Label>
                <Select
                  value={planTypeFilter}
                  onValueChange={setPlanTypeFilter}
                >
                  <SelectTrigger id="plan-type" className="mt-1">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {planTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="plan-class">Class</Label>
                <Select
                  value={classFilter}
                  onValueChange={setClassFilter}
                >
                  <SelectTrigger id="plan-class" className="mt-1">
                    <SelectValue placeholder="Filter by class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classLevels.map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isAdmin && (
                <div>
                  <Label htmlFor="plan-teacher">Teacher</Label>
                  <Select
                    value={teacherFilter}
                    onValueChange={setTeacherFilter}
                  >
                    <SelectTrigger id="plan-teacher" className="mt-1">
                      <SelectValue placeholder="Filter by teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers?.map((teacher: any) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full mt-1 justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      {startDate ? (
                        format(startDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
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

              <div>
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full mt-1 justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      {endDate ? (
                        format(endDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </TabsContent>

          <div className="mt-6 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Reports will include {activeTab === 'students' ? 'student details and progress history' : 'teaching plan details'}
            </span>
            
            <div className="flex space-x-3">
              <Button
                onClick={handleGeneratePdf}
                disabled={isGenerating || !startDate || !endDate}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="mr-2 h-4 w-4" />
                )}
                Download PDF
              </Button>
              <Button
                variant="outline"
                onClick={handleGenerateExcel}
                disabled={isGenerating || !startDate || !endDate}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileSpreadsheet className="mr-2 h-4 w-4" />
                )}
                Download Excel
              </Button>
            </div>
          </div>
        </Tabs>

        {/* Report Preview */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Report Preview</h3>
          
          {isLoadingPreview ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-purple-800">Nepal Central High School</h1>
                <h2 className="text-lg font-medium text-gray-700">
                  {activeTab === 'students' ? 'Student Progress Report' : 'Teaching Plan Report'}
                </h2>
                <p className="text-sm text-gray-500">Narephat, Kathmandu</p>
              </div>
              
              <div className="mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Class</h3>
                    <p className="mt-1 text-base text-gray-900">
                      {classFilter === 'all' ? 'All Classes' : classFilter}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 uppercase">Date Range</h3>
                    <p className="mt-1 text-base text-gray-900">
                      {startDate && endDate ? (
                        `${format(startDate, "yyyy-MM-dd")} to ${format(endDate, "yyyy-MM-dd")}`
                      ) : (
                        "Select date range"
                      )}
                    </p>
                  </div>
                </div>
              </div>
              
              {activeTab === 'students' ? (
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
                      {previewData && previewData.length > 0 ? (
                        previewData.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{item.learningAbility}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{item.writingSpeed}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{item.socialSkills}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{item.preLiteracy}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{item.preNumeracy}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-sm text-gray-500 text-center">
                            No data available for the selected filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                // Teaching plan report preview
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan Title</th>
                        <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                        <th scope="col" className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Range</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData && previewData.length > 0 ? (
                        previewData.map((item: any, index: number) => (
                          <tr key={index}>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.title}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{item.type}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{item.class}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {format(new Date(item.startDate), "yyyy-MM-dd")} to {format(new Date(item.endDate), "yyyy-MM-dd")}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="px-6 py-4 text-sm text-gray-500 text-center">
                            No data available for the selected filters
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="mt-6 text-sm text-gray-500 text-right">
                <p>Generated on: {format(new Date(), "yyyy-MM-dd")}</p>
                <p>System: Pre-Primary Student Record-Keeping System</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
