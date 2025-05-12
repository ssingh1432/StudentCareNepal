import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  downloadStudentReport, 
  downloadTeachingPlanReport 
} from '@/lib/report-generator';
import { classOptions, teachingPlanTypeOptions } from '@shared/schema';
import { Checkbox } from '@/components/ui/checkbox';

// Define the form schema
const reportSchema = z.object({
  reportType: z.enum(['students', 'plans']),
  className: z.string().optional(),
  teacherId: z.string().optional(),
  includePhotos: z.boolean().optional(),
  planType: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

type ReportFormValues = z.infer<typeof reportSchema>;

interface Teacher {
  id: number;
  name: string;
}

interface ReportFormProps {
  teachers: Teacher[];
}

const ReportForm: React.FC<ReportFormProps> = ({ teachers }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportTab, setReportTab] = useState('students');
  
  const availableClasses = user?.role === 'admin' 
    ? classOptions 
    : user?.assignedClasses || [];
  
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      reportType: 'students',
      className: '',
      teacherId: '',
      includePhotos: true,
      planType: '',
      startDate: '',
      endDate: '',
    }
  });
  
  // Handle tab change
  const handleTabChange = (value: string) => {
    setReportTab(value);
    form.setValue('reportType', value as 'students' | 'plans');
  };
  
  // Generate PDF report
  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      const values = form.getValues();
      
      if (values.reportType === 'students') {
        await downloadStudentReport({
          format: 'pdf',
          reportType: 'students',
          className: values.className || undefined,
          teacherId: values.teacherId ? parseInt(values.teacherId) : undefined,
          includePhotos: values.includePhotos,
        });
        
        toast({
          title: 'PDF Report Generated',
          description: 'Student progress report has been downloaded as PDF.',
        });
      } else {
        await downloadTeachingPlanReport({
          format: 'pdf',
          reportType: 'plans',
          className: values.className || undefined,
          planType: values.planType || undefined,
        });
        
        toast({
          title: 'PDF Report Generated',
          description: 'Teaching plan report has been downloaded as PDF.',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to generate PDF report',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Generate Excel report
  const generateExcel = async () => {
    try {
      setIsGenerating(true);
      const values = form.getValues();
      
      if (values.reportType === 'students') {
        await downloadStudentReport({
          format: 'excel',
          reportType: 'students',
          className: values.className || undefined,
          teacherId: values.teacherId ? parseInt(values.teacherId) : undefined,
        });
        
        toast({
          title: 'Excel Report Generated',
          description: 'Student progress report has been downloaded as Excel.',
        });
      } else {
        await downloadTeachingPlanReport({
          format: 'excel',
          reportType: 'plans',
          className: values.className || undefined,
          planType: values.planType || undefined,
        });
        
        toast({
          title: 'Excel Report Generated',
          description: 'Teaching plan report has been downloaded as Excel.',
        });
      }
    } catch (error) {
      toast({
        title: 'Failed to generate Excel report',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="students" value={reportTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="students">Student Progress Reports</TabsTrigger>
          <TabsTrigger value="plans">Teaching Plan Reports</TabsTrigger>
        </TabsList>
        
        <Form {...form}>
          <div className="mt-6">
            <TabsContent value="students" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="className"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All Classes" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All Classes</SelectItem>
                          {availableClasses.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {user?.role === 'admin' && (
                  <FormField
                    control={form.control}
                    name="teacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="All Teachers" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">All Teachers</SelectItem>
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
              </div>
              
              <FormField
                control={form.control}
                name="includePhotos"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
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
            </TabsContent>
            
            <TabsContent value="plans" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="planType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All Types</SelectItem>
                          {teachingPlanTypeOptions.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="className"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="All Classes" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">All Classes</SelectItem>
                          {availableClasses.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </TabsContent>
          </div>
          
          <div className="mt-6 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-sm text-gray-500 mb-4 sm:mb-0">
              {reportTab === 'students' 
                ? 'Reports will include student details and progress history'
                : 'Reports will include teaching plan details and activities'}
            </p>
            
            <div className="flex space-x-3">
              <Button 
                type="button" 
                onClick={generatePDF}
                disabled={isGenerating}
              >
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <FileText className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              
              <Button 
                type="button" 
                variant="outline"
                onClick={generateExcel}
                disabled={isGenerating}
              >
                {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </div>
        </Form>
      </Tabs>
    </div>
  );
};

export default ReportForm;
