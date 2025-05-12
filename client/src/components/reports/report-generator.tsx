import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Download } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  classOptions,
  planTypeOptions,
  Student,
  TeachingPlan
} from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Define form schema based on report type
const studentReportSchema = z.object({
  class: z.string(),
  teacherId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  includePhotos: z.boolean().default(false),
});

const planReportSchema = z.object({
  class: z.string(),
  teacherId: z.string(),
  type: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

type StudentReportFormValues = z.infer<typeof studentReportSchema>;
type PlanReportFormValues = z.infer<typeof planReportSchema>;

interface ReportGeneratorProps {
  type: "student" | "plan";
  students: Student[];
  teachers: any[];
  plans: TeachingPlan[];
  isLoading: boolean;
}

export function ReportGenerator({ type, students, teachers, plans, isLoading }: ReportGeneratorProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  // Initialize form based on report type
  const studentForm = useForm<StudentReportFormValues>({
    resolver: zodResolver(studentReportSchema),
    defaultValues: {
      class: "all",
      teacherId: "all",
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      includePhotos: true,
    },
  });

  const planForm = useForm<PlanReportFormValues>({
    resolver: zodResolver(planReportSchema),
    defaultValues: {
      class: "all",
      teacherId: "all",
      type: "all",
      startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
    },
  });

  // Handle PDF generation
  const handleGeneratePdf = async (data: StudentReportFormValues | PlanReportFormValues) => {
    setIsGeneratingPdf(true);
    
    try {
      // In a real implementation, this would call a backend endpoint to generate a PDF
      // For this demo, we'll just show a success message after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "PDF Generated",
        description: `Your ${type} report has been generated and downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Error Generating PDF",
        description: error instanceof Error ? error.message : "Failed to generate PDF report",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle Excel generation
  const handleGenerateExcel = async (data: StudentReportFormValues | PlanReportFormValues) => {
    setIsGeneratingExcel(true);
    
    try {
      // In a real implementation, this would call a backend endpoint to generate an Excel file
      // For this demo, we'll just show a success message after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Excel Generated",
        description: `Your ${type} report has been generated and downloaded.`,
      });
    } catch (error) {
      toast({
        title: "Error Generating Excel",
        description: error instanceof Error ? error.message : "Failed to generate Excel report",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  if (type === "student") {
    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Student Progress Report</h3>
        
        <Form {...studentForm}>
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <FormField
                control={studentForm.control}
                name="class"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>Class</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classOptions.map((cls) => (
                          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {user?.role === "admin" && (
                <FormField
                  control={studentForm.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-3">
                      <FormLabel>Teacher</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All Teachers" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Teachers</SelectItem>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                              {teacher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={studentForm.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>From Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isLoading} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={studentForm.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>To Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isLoading} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={studentForm.control}
                name="includePhotos"
                render={({ field }) => (
                  <FormItem className="sm:col-span-6 flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isLoading}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Include student photos in report</FormLabel>
                      <p className="text-sm text-gray-500">Photos will be included in the PDF report only</p>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Reports will include student details and progress history
              </span>
              
              <div className="flex space-x-3">
                <Button
                  type="button"
                  onClick={() => handleGeneratePdf(studentForm.getValues())}
                  disabled={isGeneratingPdf || isGeneratingExcel}
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleGenerateExcel(studentForm.getValues())}
                  disabled={isGeneratingPdf || isGeneratingExcel}
                >
                  {isGeneratingExcel ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download Excel
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    );
  } else {
    return (
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Teaching Plan Report</h3>
        
        <Form {...planForm}>
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              <FormField
                control={planForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Plan Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {planTypeOptions.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={planForm.control}
                name="class"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Class</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="All Classes" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">All Classes</SelectItem>
                        {classOptions.map((cls) => (
                          <SelectItem key={cls} value={cls}>{cls}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              {user?.role === "admin" && (
                <FormField
                  control={planForm.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Teacher</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isLoading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All Teachers" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="all">All Teachers</SelectItem>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                              {teacher.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={planForm.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>From Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isLoading} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <FormField
                control={planForm.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="sm:col-span-3">
                    <FormLabel>To Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isLoading} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            
            <div className="mt-6 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                Reports will include plan details, activities, and goals
              </span>
              
              <div className="flex space-x-3">
                <Button
                  type="button"
                  onClick={() => handleGeneratePdf(planForm.getValues())}
                  disabled={isGeneratingPdf || isGeneratingExcel}
                >
                  {isGeneratingPdf ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Download PDF
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleGenerateExcel(planForm.getValues())}
                  disabled={isGeneratingPdf || isGeneratingExcel}
                >
                  {isGeneratingExcel ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Download Excel
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </div>
    );
  }
}
