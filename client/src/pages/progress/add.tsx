import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { User, Student, ProgressEntryFormData } from "@/types";
import { createProgressEntry } from "@/lib/api";
import { formatDateForInput } from "@/lib/utils";
import { PROGRESS_RATINGS } from "@shared/schema";

interface AddProgressEntryProps {
  user: User;
  studentId?: string;
}

export default function AddProgressEntry({ user, studentId }: AddProgressEntryProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const initialStudentId = studentId ? parseInt(studentId) : undefined;
  const isAdmin = user.role === "admin";

  // Create validation schema
  const formSchema = z.object({
    studentId: z.coerce.number({
      required_error: "Student is required",
      invalid_type_error: "Student is required"
    }),
    date: z.string().min(1, "Date is required"),
    socialSkills: z.string({
      required_error: "Social skills rating is required",
    }),
    preLiteracy: z.string({
      required_error: "Pre-literacy rating is required",
    }),
    preNumeracy: z.string({
      required_error: "Pre-numeracy rating is required",
    }),
    motorSkills: z.string({
      required_error: "Motor skills rating is required",
    }),
    emotionalDevelopment: z.string({
      required_error: "Emotional development rating is required",
    }),
    comments: z.string().optional(),
  });

  // Get form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: initialStudentId || 0,
      date: formatDateForInput(new Date()),
      socialSkills: "",
      preLiteracy: "",
      preNumeracy: "",
      motorSkills: "",
      emotionalDevelopment: "",
      comments: "",
    },
  });

  // Fetch students
  const {
    data: students,
    isLoading: isLoadingStudents,
    isError: isErrorStudents,
  } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Filter students based on user access
  const accessibleStudents = students?.filter(student => 
    isAdmin || student.teacherId === user.id
  );

  // Get selected student details
  const selectedStudentId = form.watch("studentId");
  const selectedStudent = students?.find(s => s.id === selectedStudentId);

  // Create progress entry mutation
  const createMutation = useMutation({
    mutationFn: createProgressEntry,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Progress entry created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      setLocation("/progress");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create progress entry: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // If studentId is provided, set it in the form
  useEffect(() => {
    if (initialStudentId) {
      form.setValue("studentId", initialStudentId);
    }
  }, [initialStudentId, form]);

  // Submit handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    createMutation.mutate(values as ProgressEntryFormData);
  }

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Record Progress</h1>
          <p className="mt-1 text-sm text-gray-500">Track student development across key areas</p>
        </div>
        
        {isLoadingStudents ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ) : isErrorStudents ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-red-500">Failed to load students. Please try again.</p>
              <Button variant="outline" className="mt-4" onClick={() => setLocation("/progress")}>
                Back to Progress Tracking
              </Button>
            </CardContent>
          </Card>
        ) : accessibleStudents?.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-yellow-600">No students assigned to you yet. Please contact admin to assign students.</p>
              <Button variant="outline" className="mt-4" onClick={() => setLocation("/progress")}>
                Back to Progress Tracking
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedStudent ? `Record Progress for ${selectedStudent.name}` : "Record Student Progress"}
              </CardTitle>
              <CardDescription>
                {selectedStudent 
                  ? `Tracking development for ${selectedStudent.name} in ${selectedStudent.class}` 
                  : "Select a student and enter progress ratings"}
              </Description>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student</FormLabel>
                          <Select
                            onValueChange={(value) => field.onChange(parseInt(value))}
                            defaultValue={field.value ? String(field.value) : undefined}
                            disabled={!!initialStudentId}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a student" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {accessibleStudents?.map((student) => (
                                <SelectItem key={student.id} value={String(student.id)}>
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
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="socialSkills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Social Skills</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PROGRESS_RATINGS.map((rating) => (
                                <SelectItem key={rating} value={rating}>
                                  {rating}
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
                      name="preLiteracy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pre-Literacy</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PROGRESS_RATINGS.map((rating) => (
                                <SelectItem key={rating} value={rating}>
                                  {rating}
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
                      name="preNumeracy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pre-Numeracy</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PROGRESS_RATINGS.map((rating) => (
                                <SelectItem key={rating} value={rating}>
                                  {rating}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="motorSkills"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Motor Skills</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PROGRESS_RATINGS.map((rating) => (
                                <SelectItem key={rating} value={rating}>
                                  {rating}
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
                      name="emotionalDevelopment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emotional Development</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {PROGRESS_RATINGS.map((rating) => (
                                <SelectItem key={rating} value={rating}>
                                  {rating}
                                </SelectItem>
                              ))}
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
                            placeholder="Additional comments about the student's progress"
                            className="resize-none"
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
                      onClick={() => setLocation("/progress")}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createMutation.isPending}
                    >
                      {createMutation.isPending ? "Saving..." : "Save Progress"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
