import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { 
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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
import { CloudinaryUpload } from "@/components/CloudinaryUpload";

interface Teacher {
  id: number;
  name: string;
  email: string;
  role: string;
  assignedClasses: string[];
}

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  age: z.coerce.number().min(3, { message: "Age must be at least 3 years" }).max(5, { message: "Age must be at most 5 years" }),
  class: z.enum(["Nursery", "LKG", "UKG"], { message: "Please select a class" }),
  parentContact: z.string().optional(),
  learningAbility: z.enum(["Talented", "Average", "Slow Learner"], { message: "Please select learning ability" }),
  writingSpeed: z.enum(["Slow Writing", "Speed Writing", "N/A"], { message: "Please select writing speed" }).optional(),
  notes: z.string().optional(),
  teacherId: z.coerce.number({ message: "Please select a teacher" })
});

type FormData = z.infer<typeof formSchema>;

interface AddEditStudentProps {
  mode: "add" | "edit";
  id?: number;
}

export default function AddEditStudent({ mode, id }: AddEditStudentProps) {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const isAdmin = user?.role === "admin";

  // Fetch teachers for dropdown
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
  });

  // For edit mode, fetch the current student data
  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: [`/api/students/${id}`],
    enabled: mode === "edit" && !!id,
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: 3,
      class: "Nursery" as const,
      parentContact: "",
      learningAbility: "Average" as const,
      writingSpeed: "N/A" as const,
      notes: "",
      teacherId: isAdmin ? undefined : user?.id
    }
  });

  // Update form with existing student data when editing
  useEffect(() => {
    if (mode === "edit" && student) {
      form.reset({
        name: student.name,
        age: student.age,
        class: student.class as "Nursery" | "LKG" | "UKG",
        parentContact: student.parentContact || "",
        learningAbility: student.learningAbility as "Talented" | "Average" | "Slow Learner",
        writingSpeed: student.writingSpeed || "N/A",
        notes: student.notes || "",
        teacherId: student.teacherId
      });
      setPhotoUrl(student.photoUrl);
    }
  }, [student, form, mode]);

  // Auto-adjust writingSpeed based on class
  useEffect(() => {
    const classValue = form.watch("class");
    if (classValue === "Nursery") {
      form.setValue("writingSpeed", "N/A");
    }
  }, [form.watch("class"), form]);

  // Handle form submission
  const onSubmit = async (data: FormData) => {
    // For Nursery class, writing speed is always N/A
    if (data.class === "Nursery") {
      data.writingSpeed = "N/A";
    }

    try {
      if (mode === "add") {
        // Create a new student
        const response = await apiRequest("POST", "/api/students", data);
        const newStudent = await response.json();

        // Invalidate cache
        queryClient.invalidateQueries({ queryKey: ['/api/students'] });
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });

        toast({
          title: "Student added",
          description: `${data.name} has been added successfully.`
        });

        // If photo was set in state but not yet uploaded (rare case), allow upload
        if (photoUrl && newStudent.id) {
          navigate(`/students/edit/${newStudent.id}`);
        } else {
          navigate("/students");
        }
      } else if (mode === "edit" && id) {
        // Update existing student
        await apiRequest("PUT", `/api/students/${id}`, data);

        // Invalidate cache
        queryClient.invalidateQueries({ queryKey: [`/api/students/${id}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/students'] });

        toast({
          title: "Student updated",
          description: `${data.name} has been updated successfully.`
        });

        navigate("/students");
      }
    } catch (error) {
      console.error("Error saving student:", error);
      toast({
        title: "Error",
        description: "Failed to save student. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handle photo upload completion
  const handlePhotoUploadComplete = (url: string) => {
    setPhotoUrl(url);
  };

  const isLoading = isLoadingTeachers || (mode === "edit" && isLoadingStudent);

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
        <Button variant="outline" onClick={() => navigate("/students")} className="mb-4">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Students
        </Button>
        <h2 className="text-2xl font-bold text-gray-900">
          {mode === "add" ? "Add New Student" : `Edit ${student?.name}`}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {mode === "add" 
            ? "Create a new student profile in the pre-primary section" 
            : "Update the student's information"
          }
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Student's full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age (years)</FormLabel>
                        <FormControl>
                          <Input type="number" min={3} max={5} {...field} />
                        </FormControl>
                        <FormDescription>Age must be between 3-5 years</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="class"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Nursery">Nursery (~3 years)</SelectItem>
                            <SelectItem value="LKG">LKG (~4 years)</SelectItem>
                            <SelectItem value="UKG">UKG (~5 years)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parentContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Contact (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Phone number or email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="learningAbility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Learning Ability</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ability" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Talented">Talented</SelectItem>
                            <SelectItem value="Average">Average</SelectItem>
                            <SelectItem value="Slow Learner">Slow Learner</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="writingSpeed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Writing Speed</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          value={field.value}
                          disabled={form.watch("class") === "Nursery"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select writing speed" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Speed Writing">Speed Writing</SelectItem>
                            <SelectItem value="Slow Writing">Slow Writing</SelectItem>
                            <SelectItem value="N/A">Not Applicable</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.watch("class") === "Nursery" && (
                          <FormDescription>Writing speed is not applicable for Nursery students</FormDescription>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned Teacher</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value?.toString()}
                        value={field.value?.toString()}
                        disabled={!isAdmin}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers.map(teacher => (
                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                              {teacher.name} - {teacher.assignedClasses.join(", ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {!isAdmin && (
                        <FormDescription>Only administrators can change teacher assignments</FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any additional notes about the student" 
                          {...field} 
                          rows={3} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate("/students")}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    <Save className="mr-2 h-4 w-4" />
                    {mode === "add" ? "Create Student" : "Update Student"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Student Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            {mode === "edit" && id ? (
              <CloudinaryUpload 
                studentId={id} 
                currentPhotoUrl={photoUrl}
                onUploadComplete={handlePhotoUploadComplete}
              />
            ) : (
              <div className="text-center p-4">
                <p className="text-sm text-gray-500">Save the student profile first to enable photo upload.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
