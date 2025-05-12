import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useSearchParams } from "wouter/use-location";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { insertProgressSchema, Progress, Student } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { formatCloudinaryUrl } from "@/lib/utils";

// Extend the schema with custom validations
const progressFormSchema = insertProgressSchema.extend({
  date: z.string(),
  comments: z.string().optional()
});

type ProgressFormValues = z.infer<typeof progressFormSchema>;

interface ProgressFormProps {
  mode?: "create" | "edit";
}

export default function ProgressForm({ mode = "create" }: ProgressFormProps) {
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const progressId = params.id ? parseInt(params.id) : undefined;
  const isEditMode = mode === "edit" && progressId !== undefined;
  
  // Get studentId from URL query params if available (for creating new progress entry for a specific student)
  const preselectedStudentId = searchParams.studentId ? parseInt(searchParams.studentId) : undefined;

  // Fetch progress data if in edit mode
  const { data: progressEntry, isLoading: isProgressLoading } = useQuery<Progress>({
    queryKey: [`/api/progress/${progressId}`],
    enabled: isEditMode,
  });

  // Fetch students for the student selection dropdown
  const { data: students = [], isLoading: isStudentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Initialize form with default values
  const form = useForm<ProgressFormValues>({
    resolver: zodResolver(progressFormSchema),
    defaultValues: {
      studentId: preselectedStudentId || 0,
      date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      socialSkills: "Good",
      preLiteracy: "Good",
      preNumeracy: "Good",
      motorSkills: "Good",
      emotionalDev: "Good",
      comments: "",
      createdBy: user?.id || 0
    }
  });

  // Update form values when progress data is loaded
  useEffect(() => {
    if (isEditMode && progressEntry) {
      form.reset({
        studentId: progressEntry.studentId,
        date: new Date(progressEntry.date).toISOString().split('T')[0],
        socialSkills: progressEntry.socialSkills,
        preLiteracy: progressEntry.preLiteracy,
        preNumeracy: progressEntry.preNumeracy,
        motorSkills: progressEntry.motorSkills,
        emotionalDev: progressEntry.emotionalDev,
        comments: progressEntry.comments || "",
        createdBy: progressEntry.createdBy
      });
    }
  }, [isEditMode, progressEntry, form]);

  // Create progress mutation
  const createProgressMutation = useMutation({
    mutationFn: async (values: ProgressFormValues) => {
      return await apiRequest("POST", "/api/progress", values);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Progress entry created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/progress/all'] });
      navigate("/progress");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (values: ProgressFormValues) => {
      return await apiRequest("PUT", `/api/progress/${progressId}`, values);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Progress entry updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/progress/all'] });
      queryClient.invalidateQueries({ queryKey: [`/api/progress/${progressId}`] });
      navigate("/progress");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Form submission handler
  const onSubmit = (values: ProgressFormValues) => {
    // Add the current user ID as creator if creating a new entry
    if (!isEditMode) {
      values.createdBy = user?.id || 0;
    }
    
    // Convert date string to Date object for the API
    const progressData = {
      ...values,
      date: new Date(values.date),
    };
    
    if (isEditMode) {
      updateProgressMutation.mutate(progressData);
    } else {
      createProgressMutation.mutate(progressData);
    }
  };

  // Get student by ID
  const getStudentById = (id: number) => {
    return students.find(student => student.id === id);
  };

  // Loading state
  if ((isEditMode && isProgressLoading) || isStudentsLoading) {
    return (
      <AppLayout title="Loading...">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </AppLayout>
    );
  }

  // Get selected student
  const selectedStudentId = form.watch("studentId");
  const selectedStudent = getStudentById(selectedStudentId);

  return (
    <AppLayout title={isEditMode ? "Edit Progress Entry" : "Record Student Progress"}>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Button variant="ghost" size="sm" onClick={() => navigate("/progress")}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Progress Tracking
              </Button>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {isEditMode ? "Edit Progress Entry" : "Record Progress"}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Student selection and date */}
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <Select
                          value={field.value.toString()}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          disabled={isEditMode || preselectedStudentId !== undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students.map((student) => (
                              <SelectItem key={student.id} value={student.id.toString()}>
                                {student.name} ({student.class})
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
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                              <Calendar className="h-4 w-4" />
                            </span>
                            <input
                              type="date"
                              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Display selected student information */}
                {selectedStudent && (
                  <div className="bg-gray-50 p-4 rounded-md mb-6">
                    <div className="flex items-center">
                      <Avatar className="h-12 w-12 mr-4">
                        <AvatarImage 
                          src={selectedStudent.photoUrl ? formatCloudinaryUrl(selectedStudent.photoUrl, { width: 48, height: 48 }) : undefined} 
                          alt={selectedStudent.name} 
                        />
                        <AvatarFallback>{selectedStudent.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-md font-medium">{selectedStudent.name}</h3>
                        <div className="flex space-x-4 text-sm text-gray-500">
                          <span>{selectedStudent.class}</span>
                          <span>{selectedStudent.age} years</span>
                          <span>Learning: {selectedStudent.learningAbility}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="socialSkills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Skills</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Excellent">Excellent</SelectItem>
                            <SelectItem value="Good">Good</SelectItem>
                            <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="preLiteracy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pre-Literacy</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Excellent">Excellent</SelectItem>
                            <SelectItem value="Good">Good</SelectItem>
                            <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="preNumeracy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pre-Numeracy</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Excellent">Excellent</SelectItem>
                            <SelectItem value="Good">Good</SelectItem>
                            <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="motorSkills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Motor Skills</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Excellent">Excellent</SelectItem>
                            <SelectItem value="Good">Good</SelectItem>
                            <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="emotionalDev"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emotional Development</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select rating" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Excellent">Excellent</SelectItem>
                            <SelectItem value="Good">Good</SelectItem>
                            <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comments (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional observations or notes"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/progress")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createProgressMutation.isPending || updateProgressMutation.isPending}
                  >
                    {(createProgressMutation.isPending || updateProgressMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isEditMode ? "Update Progress" : "Save Progress"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
