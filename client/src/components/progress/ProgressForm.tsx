import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Create schema for progress form
const progressSchema = z.object({
  studentId: z.number({
    required_error: "Student is required",
  }),
  date: z.date({
    required_error: "Date is required",
  }).default(new Date()),
  socialSkills: z.enum(["Excellent", "Good", "Needs Improvement"], {
    required_error: "Social skills rating is required",
  }),
  preLiteracy: z.enum(["Excellent", "Good", "Needs Improvement"], {
    required_error: "Pre-literacy rating is required",
  }),
  preNumeracy: z.enum(["Excellent", "Good", "Needs Improvement"], {
    required_error: "Pre-numeracy rating is required",
  }),
  motorSkills: z.enum(["Excellent", "Good", "Needs Improvement"], {
    required_error: "Motor skills rating is required",
  }),
  emotionalDevelopment: z.enum(["Excellent", "Good", "Needs Improvement"], {
    required_error: "Emotional development rating is required",
  }),
  comments: z.string().optional(),
});

type ProgressFormValues = z.infer<typeof progressSchema>;

interface ProgressFormProps {
  progressId: number | null;
  onClose: () => void;
}

export default function ProgressForm({ progressId, onClose }: ProgressFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [studentDetails, setStudentDetails] = useState<any>(null);
  
  // Parse query parameters
  const params = new URLSearchParams(location.split("?")[1]);
  const studentIdFromQuery = params.get("studentId");
  
  // Set up form with default values
  const form = useForm<ProgressFormValues>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      studentId: studentIdFromQuery ? parseInt(studentIdFromQuery) : 0,
      date: new Date(),
      socialSkills: "Good",
      preLiteracy: "Good",
      preNumeracy: "Good",
      motorSkills: "Good",
      emotionalDevelopment: "Good",
      comments: "",
    },
  });

  // Fetch progress entry data if editing
  const { data: progressEntry, isLoading: loadingProgress } = useQuery({
    queryKey: ["/api/progress", progressId],
    queryFn: async () => {
      if (!progressId) return null;
      
      const res = await fetch(`/api/progress/${progressId}`, {
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to fetch progress entry");
      return res.json();
    },
    enabled: !!progressId,
  });

  // Fetch students for dropdown
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const res = await fetch("/api/students", {
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });

  // Create progress mutation
  const createProgressMutation = useMutation({
    mutationFn: async (data: ProgressFormValues) => {
      return apiRequest("POST", "/api/progress", {
        ...data,
        createdById: user?.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Progress recorded",
        description: "Student progress has been successfully recorded",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to record progress: ${error.message}`,
      });
    },
  });

  // Update progress mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (data: ProgressFormValues) => {
      return apiRequest("PATCH", `/api/progress/${progressId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Progress updated",
        description: "Student progress has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update progress: ${error.message}`,
      });
    },
  });

  // Set form values when progress data is loaded
  useEffect(() => {
    if (progressEntry) {
      form.reset({
        studentId: progressEntry.studentId,
        date: new Date(progressEntry.date),
        socialSkills: progressEntry.socialSkills,
        preLiteracy: progressEntry.preLiteracy,
        preNumeracy: progressEntry.preNumeracy,
        motorSkills: progressEntry.motorSkills,
        emotionalDevelopment: progressEntry.emotionalDevelopment,
        comments: progressEntry.comments || "",
      });
    }
  }, [progressEntry, form]);

  // Set student details when student is selected
  useEffect(() => {
    const studentId = form.watch("studentId");
    if (students && studentId) {
      const student = students.find((s: any) => s.id === studentId);
      if (student) {
        setStudentDetails(student);
      }
    }
  }, [students, form.watch("studentId")]);

  // Handle form submission
  const onSubmit = (data: ProgressFormValues) => {
    if (progressId) {
      updateProgressMutation.mutate(data);
    } else {
      createProgressMutation.mutate(data);
    }
  };

  // Determine if fields should be disabled based on loading states
  const isFormDisabled = 
    loadingProgress || 
    loadingStudents || 
    createProgressMutation.isPending || 
    updateProgressMutation.isPending;

  return (
    <Card className="shadow-lg">
      <CardHeader className="bg-gray-50 border-b border-gray-200">
        <Button 
          variant="ghost" 
          size="sm"
          onClick={onClose}
          className="absolute top-4 left-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <CardTitle className="text-center text-xl">
          {progressId ? "Edit Progress Entry" : "Record Progress"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {(loadingProgress || loadingStudents) ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString()}
                      disabled={isFormDisabled || !!studentIdFromQuery}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectGroup>
                          {students?.map((student: any) => (
                            <SelectItem 
                              key={student.id} 
                              value={student.id.toString()}
                            >
                              {student.name} ({student.class})
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {studentDetails && (
                <div className="bg-gray-50 p-4 rounded-lg mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Student Details</h3>
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-4">
                      {studentDetails.photoUrl ? (
                        <AvatarImage src={studentDetails.photoUrl} alt={studentDetails.name} />
                      ) : null}
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {studentDetails.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{studentDetails.name}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge className="text-xs">
                          {studentDetails.class}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {studentDetails.learningAbility}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
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
                        value={field.value ? field.value.toISOString().substring(0, 10) : ""}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                        disabled={isFormDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="socialSkills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Social Skills</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isFormDisabled}
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
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isFormDisabled}
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
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isFormDisabled}
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
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isFormDisabled}
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
                  name="emotionalDevelopment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emotional Development</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={isFormDisabled}
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
                        placeholder="Add any additional comments about the student's progress" 
                        rows={3}
                        {...field} 
                        disabled={isFormDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isFormDisabled}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={isFormDisabled}
                >
                  {isFormDisabled ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      {progressId ? "Updating..." : "Saving..."}
                    </>
                  ) : (
                    progressId ? "Update Progress" : "Save Progress"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
