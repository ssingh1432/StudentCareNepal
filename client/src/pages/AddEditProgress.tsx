import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ChevronLeft, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";

interface Student {
  id: number;
  name: string;
  class: string;
  photoUrl: string | null;
}

interface ProgressEntry {
  id: number;
  studentId: number;
  date: string;
  socialSkills: string;
  preLiteracy: string;
  preNumeracy: string;
  motorSkills: string;
  emotionalDevelopment: string;
  comments: string | null;
  createdBy: number;
  createdAt: string;
}

const formSchema = z.object({
  studentId: z.coerce.number(),
  date: z.string(),
  socialSkills: z.enum(["Excellent", "Good", "Needs Improvement"]),
  preLiteracy: z.enum(["Excellent", "Good", "Needs Improvement"]),
  preNumeracy: z.enum(["Excellent", "Good", "Needs Improvement"]),
  motorSkills: z.enum(["Excellent", "Good", "Needs Improvement"]),
  emotionalDevelopment: z.enum(["Excellent", "Good", "Needs Improvement"]),
  comments: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface AddEditProgressProps {
  mode: "add" | "edit";
  id?: number;
  studentId?: number;
}

export default function AddEditProgress({ mode, id, studentId }: AddEditProgressProps) {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch students for dropdown
  const { data: students = [], isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  // For edit mode, fetch the current progress entry
  const { data: progressEntry, isLoading: isLoadingEntry } = useQuery<ProgressEntry>({
    queryKey: [`/api/progress/${id}`],
    enabled: mode === "edit" && !!id,
  });

  // Get today's date in ISO format for the date picker default
  const today = new Date().toISOString().split('T')[0];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      studentId: studentId || undefined,
      date: today,
      socialSkills: "Good" as const,
      preLiteracy: "Good" as const,
      preNumeracy: "Good" as const,
      motorSkills: "Good" as const,
      emotionalDevelopment: "Good" as const,
      comments: "",
    }
  });

  // Update form with existing progress entry data when editing
  useEffect(() => {
    if (mode === "edit" && progressEntry) {
      form.reset({
        studentId: progressEntry.studentId,
        date: new Date(progressEntry.date).toISOString().split('T')[0],
        socialSkills: progressEntry.socialSkills as "Excellent" | "Good" | "Needs Improvement",
        preLiteracy: progressEntry.preLiteracy as "Excellent" | "Good" | "Needs Improvement",
        preNumeracy: progressEntry.preNumeracy as "Excellent" | "Good" | "Needs Improvement",
        motorSkills: progressEntry.motorSkills as "Excellent" | "Good" | "Needs Improvement",
        emotionalDevelopment: progressEntry.emotionalDevelopment as "Excellent" | "Good" | "Needs Improvement",
        comments: progressEntry.comments || "",
      });
    }
  }, [progressEntry, form, mode]);

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    try {
      // Add the current user as the creator
      const submitData = {
        ...data,
        createdBy: user?.id
      };

      if (mode === "add") {
        // Create a new progress entry
        await apiRequest("POST", "/api/progress", submitData);

        // Invalidate cache
        queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });

        toast({
          title: "Progress recorded",
          description: "Student progress has been recorded successfully."
        });

        navigate("/progress");
      } else if (mode === "edit" && id) {
        // Update existing progress entry
        await apiRequest("PUT", `/api/progress/${id}`, submitData);

        // Invalidate cache
        queryClient.invalidateQueries({ queryKey: [`/api/progress/${id}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/progress', data.studentId.toString()] });

        toast({
          title: "Progress updated",
          description: "Progress entry has been updated successfully."
        });

        navigate("/progress");
      }
    } catch (error) {
      console.error("Error saving progress:", error);
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getSelectedStudentClass = () => {
    const studentId = form.watch("studentId");
    const selectedStudent = students.find(student => student.id === studentId);
    return selectedStudent?.class || "";
  };

  const isLoading = isLoadingStudents || (mode === "edit" && isLoadingEntry);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate("/progress")} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Progress Tracking
        </Button>
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === "add" ? "Record Student Progress" : "Edit Progress Entry"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {mode === "add" 
            ? "Record progress for a student in various developmental areas" 
            : "Update the progress entry information"
          }
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{mode === "add" ? "New Progress Entry" : "Edit Progress Entry"}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                        value={field.value?.toString()}
                        disabled={mode === "edit" || !!studentId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map(student => (
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
                        <input 
                          type="date" 
                          {...field}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="socialSkills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Social Skills</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
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
                        value={field.value}
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
                        value={field.value}
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="motorSkills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motor Skills</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
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
                        value={field.value}
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
                        placeholder="Add any additional comments or observations" 
                        {...field} 
                        rows={3} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/progress")}
                  type="button"
                >
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="mr-2 h-4 w-4" />
                  {mode === "add" ? "Save Progress" : "Update Progress"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
