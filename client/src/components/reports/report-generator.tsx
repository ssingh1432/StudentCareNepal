import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Student, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileSpreadsheet, File, Loader2 } from "lucide-react";

const studentReportSchema = z.object({
  classType: z.string().optional(),
  teacherId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  includePhotos: z.boolean().default(false),
});

const planReportSchema = z.object({
  type: z.string().optional(),
  classType: z.string().optional(),
});

type StudentReportFormValues = z.infer<typeof studentReportSchema>;
type PlanReportFormValues = z.infer<typeof planReportSchema>;

export function ReportGenerator() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>("student-progress");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);

  // Query for teachers (admin only)
  const { data: teachers = [] } = useQuery<(User & { assignedClasses?: string[] })[]>({
    queryKey: ["/api/teachers"],
    enabled: user?.role === "admin",
  });

  // Student progress report form
  const studentReportForm = useForm<StudentReportFormValues>({
    resolver: zodResolver(studentReportSchema),
    defaultValues: {
      classType: "all",
      teacherId: "all",
      includePhotos: false,
    },
  });

  // Teaching plan report form
  const planReportForm = useForm<PlanReportFormValues>({
    resolver: zodResolver(planReportSchema),
    defaultValues: {
      type: "all",
      classType: "all",
    },
  });

  const handleStudentReportSubmit = async (values: StudentReportFormValues, format: "pdf" | "excel") => {
    try {
      if (format === "pdf") {
        setIsGeneratingPdf(true);
      } else {
        setIsGeneratingExcel(true);
      }

      // Prepare the request payload
      const payload = {
        classType: values.classType !== "all" ? values.classType : undefined,
        teacherId: values.teacherId !== "all" ? values.teacherId : undefined,
        startDate: values.startDate,
        endDate: values.endDate,
        includePhotos: values.includePhotos,
      };

      // Make the request to generate the report
      const response = await fetch(`/api/reports/student-progress/${format}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create an anchor element and trigger a download
      const a = document.createElement("a");
      a.href = url;
      a.download = `student-progress-report.${format}`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Report generated",
        description: `The ${format.toUpperCase()} report has been generated and downloaded.`,
      });
    } catch (error: any) {
      toast({
        title: "Error generating report",
        description: error.message || "An error occurred while generating the report.",
        variant: "destructive",
      });
    } finally {
      if (format === "pdf") {
        setIsGeneratingPdf(false);
      } else {
        setIsGeneratingExcel(false);
      }
    }
  };

  const handlePlanReportSubmit = async (values: PlanReportFormValues, format: "pdf" | "excel") => {
    try {
      if (format === "pdf") {
        setIsGeneratingPdf(true);
      } else {
        setIsGeneratingExcel(true);
      }

      // Prepare the request payload
      const payload = {
        type: values.type !== "all" ? values.type : undefined,
        classType: values.classType !== "all" ? values.classType : undefined,
      };

      // Make the request to generate the report
      const response = await fetch(`/api/reports/teaching-plans/${format}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`);
      }

      // Get the blob from the response
      const blob = await response.blob();

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create an anchor element and trigger a download
      const a = document.createElement("a");
      a.href = url;
      a.download = `teaching-plans-report.${format}`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Report generated",
        description: `The ${format.toUpperCase()} report has been generated and downloaded.`,
      });
    } catch (error: any) {
      toast({
        title: "Error generating report",
        description: error.message || "An error occurred while generating the report.",
        variant: "destructive",
      });
    } finally {
      if (format === "pdf") {
        setIsGeneratingPdf(false);
      } else {
        setIsGeneratingExcel(false);
      }
    }
  };

  return (
    <Tabs defaultValue="student-progress" onValueChange={setActiveTab} className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Report Generator</h2>
        <TabsList>
          <TabsTrigger value="student-progress">Student Progress</TabsTrigger>
          <TabsTrigger value="teaching-plans">Teaching Plans</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="student-progress">
        <Card>
          <CardHeader>
            <CardTitle>Generate Student Progress Report</CardTitle>
            <CardDescription>
              Create comprehensive reports of student progress across all development areas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...studentReportForm}>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={studentReportForm.control}
                    name="classType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            <SelectItem value="nursery">Nursery</SelectItem>
                            <SelectItem value="lkg">LKG</SelectItem>
                            <SelectItem value="ukg">UKG</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {user?.role === "admin" && (
                    <FormField
                      control={studentReportForm.control}
                      name="teacherId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teacher</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select teacher" />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={studentReportForm.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>From Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Optional start date for progress entries
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={studentReportForm.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>To Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          Optional end date for progress entries
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="sm:col-span-2">
                    <FormField
                      control={studentReportForm.control}
                      name="includePhotos"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Include student photos in report</FormLabel>
                            <FormDescription>
                              Photos will be included in the PDF report only
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleStudentReportSubmit(studentReportForm.getValues(), "excel")}
                    disabled={isGeneratingExcel || isGeneratingPdf}
                  >
                    {isGeneratingExcel ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Download Excel
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleStudentReportSubmit(studentReportForm.getValues(), "pdf")}
                    disabled={isGeneratingExcel || isGeneratingPdf}
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <File className="mr-2 h-4 w-4" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="teaching-plans">
        <Card>
          <CardHeader>
            <CardTitle>Generate Teaching Plans Report</CardTitle>
            <CardDescription>
              Create reports of teaching plans including activities and learning goals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...planReportForm}>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={planReportForm.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={planReportForm.control}
                    name="classType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="all">All Classes</SelectItem>
                            <SelectItem value="nursery">Nursery</SelectItem>
                            <SelectItem value="lkg">LKG</SelectItem>
                            <SelectItem value="ukg">UKG</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handlePlanReportSubmit(planReportForm.getValues(), "excel")}
                    disabled={isGeneratingExcel || isGeneratingPdf}
                  >
                    {isGeneratingExcel ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Download Excel
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handlePlanReportSubmit(planReportForm.getValues(), "pdf")}
                    disabled={isGeneratingExcel || isGeneratingPdf}
                  >
                    {isGeneratingPdf ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <File className="mr-2 h-4 w-4" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Report Preview Section */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>
              Sample layout of the generated report
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-purple-800">Nepal Central High School</h1>
                <h2 className="text-lg font-medium text-gray-700">
                  {activeTab === "student-progress" ? "Student Progress Report" : "Teaching Plans Report"}
                </h2>
                <p className="text-sm text-gray-500">Narephat, Kathmandu</p>
              </div>

              {activeTab === "student-progress" ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Social Skills
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pre-Literacy
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Pre-Numeracy
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Sample Student
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          UKG
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Excellent
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Good
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Excellent
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plan Title
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Class
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Sample Plan Title
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Weekly
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          LKG
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          Jan 1, 2023 - Jan 7, 2023
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 text-sm text-gray-500 text-right">
                <p>Generated on: {new Date().toLocaleDateString()}</p>
                <p>Nepal Central High School Pre-Primary System</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Tabs>
  );
}
