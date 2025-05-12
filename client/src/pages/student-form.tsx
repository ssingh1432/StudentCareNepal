import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { PhotoUpload } from "@/components/ui/photo-upload";
import { insertStudentSchema, Student, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Loader2 } from "lucide-react";

// Extend the schema with custom validations
const studentFormSchema = insertStudentSchema.extend({
  parentContact: z.string().optional(),
  teacherId: z.number().optional()
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  mode?: "create" | "edit";
}

export default function StudentForm({ mode = "create" }: StudentFormProps) {
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const studentId = params.id ? parseInt(params.id) : undefined;
  const isEditMode = mode === "edit" && studentId !== undefined;

  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [photoPublicId, setPhotoPublicId] = useState<string>("");

  // Fetch student data if in edit mode
  const { data: student, isLoading: isStudentLoading } = useQuery<Student>({
    queryKey: [`/api/students/${studentId}`],
    enabled: isEditMode,
  });

  // Fetch teachers for the teacher assignment dropdown
  const { data: teachers = [] } = useQuery<User[]>({
    queryKey: ["/api/teachers"],
  });

  // Initialize form with default values
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      age: 3,
      class: "Nursery",
      parentContact: "",
      learningAbility: "Average",
      writingSpeed: "N/A",
      notes: "",
      teacherId: undefined,
    }
  });

  // Update form values when student data is loaded
  useEffect(() => {
    if (isEditMode && student) {
      form.reset({
        name: student.name,
        age: student.age,
        class: student.class,
        parentContact: student.parentContact || "",
        learningAbility: student.learningAbility,
        writingSpeed: student.writingSpeed,
        notes: student.notes || "",
        teacherId: student.teacherId,
      });
      
      if (student.photoUrl) {
        setPhotoUrl(student.photoUrl);
      }
      
      if (student.photoPublicId) {
        setPhotoPublicId(student.photoPublicId);
      }
    }
  }, [isEditMode, student, form]);

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/students", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create student");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      navigate("/students");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update student");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: [`/api/students/${studentId}`] });
      navigate("/students");
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
  const onSubmit = async (values: StudentFormValues) => {
    // Create FormData to send both JSON data and file
    const formData = new FormData();
    
    // Add photo information to the values
    const studentData = {
      ...values,
      photoUrl,
      photoPublicId
    };
    
    // Convert the data to JSON and add to FormData
    formData.append("data", JSON.stringify(studentData));
    
    // Submit the form data
    if (isEditMode) {
      updateStudentMutation.mutate(formData);
    } else {
      createStudentMutation.mutate(formData);
    }
  };

  // Handle photo change
  const handlePhotoChange = (url: string, publicId: string) => {
    setPhotoUrl(url);
    setPhotoPublicId(publicId);
  };

  // Loading state
  if (isEditMode && isStudentLoading) {
    return (
      <AppLayout title="Loading Student...">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title={isEditMode ? "Edit Student" : "Add New Student"}>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Button variant="ghost" size="sm" onClick={() => navigate("/students")}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Students
              </Button>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {isEditMode ? "Edit Student" : "Add New Student"}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left column - Photo upload */}
                  <div className="flex flex-col items-center">
                    <FormLabel className="mb-2">Student Photo</FormLabel>
                    <PhotoUpload
                      photoUrl={photoUrl}
                      onChange={handlePhotoChange}
                      onError={(error) => {
                        toast({
                          title: "Upload Error",
                          description: error,
                          variant: "destructive",
                        });
                      }}
                      width={200}
                      height={200}
                    />
                    <FormDescription className="text-center mt-2">
                      Upload a clear photo of the student (1MB max)
                    </FormDescription>
                  </div>
                  
                  {/* Right column - Form fields */}
                  <div className="md:col-span-2 space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter student's full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Age (years)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min={3}
                                max={5}
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="class"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Nursery">Nursery</SelectItem>
                                <SelectItem value="LKG">LKG</SelectItem>
                                <SelectItem value="UKG">UKG</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="learningAbility"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Learning Ability</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
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
                              value={field.value}
                              onValueChange={field.onChange}
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
                            <FormDescription>
                              Select N/A for Nursery students
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="parentContact"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Parent Contact (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Phone number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="teacherId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Assign Teacher</FormLabel>
                            <Select
                              value={field.value?.toString() || ""}
                              onValueChange={(value) => 
                                field.onChange(value ? parseInt(value) : undefined)
                              }
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select teacher" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Not Assigned</SelectItem>
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
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Additional information about the student"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/students")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createStudentMutation.isPending || updateStudentMutation.isPending}
                  >
                    {(createStudentMutation.isPending || updateStudentMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isEditMode ? "Update Student" : "Add Student"}
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
