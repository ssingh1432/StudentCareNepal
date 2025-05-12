import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { 
  ArrowLeft,
  Loader2,
} from "lucide-react";
import CloudinaryUpload from "@/components/ui/CloudinaryUpload";

// Create schema for student form
const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(3, "Age must be at least 3").max(5, "Age must be at most 5"),
  class: z.enum(["Nursery", "LKG", "UKG"]),
  parentContact: z.string().optional(),
  learningAbility: z.enum(["Talented", "Average", "Slow Learner"]),
  writingSpeed: z.enum(["Speed Writing", "Slow Writing", "N/A"]),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
  teacherId: z.number().optional(),
});

type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  studentId: number | null;
  onClose: () => void;
}

export default function StudentForm({ studentId, onClose }: StudentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photoUrl, setPhotoUrl] = useState<string>("");
  
  // Set up form with default values
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: "",
      age: 3,
      class: "Nursery",
      parentContact: "",
      learningAbility: "Average",
      writingSpeed: "N/A",
      notes: "",
      photoUrl: "",
      teacherId: user?.role === "teacher" ? user.id : undefined,
    },
  });

  // Fetch student data if editing
  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ["/api/students", studentId],
    queryFn: async () => {
      if (!studentId) return null;
      
      const res = await fetch(`/api/students/${studentId}`, {
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to fetch student");
      return res.json();
    },
    enabled: !!studentId,
  });

  // Fetch teachers for dropdown (admin only)
  const { data: teachers, isLoading: loadingTeachers } = useQuery({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const res = await fetch("/api/teachers", {
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json();
    },
    enabled: user?.role === "admin",
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: async (data: StudentFormValues) => {
      return apiRequest("POST", "/api/students", data);
    },
    onSuccess: () => {
      toast({
        title: "Student created",
        description: "Student has been successfully created",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to create student: ${error.message}`,
      });
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async (data: StudentFormValues) => {
      return apiRequest("PATCH", `/api/students/${studentId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Student updated",
        description: "Student has been successfully updated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      onClose();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to update student: ${error.message}`,
      });
    },
  });

  // Set form values when student data is loaded
  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name,
        age: student.age,
        class: student.class,
        parentContact: student.parentContact || "",
        learningAbility: student.learningAbility,
        writingSpeed: student.writingSpeed,
        notes: student.notes || "",
        photoUrl: student.photoUrl || "",
        teacherId: student.teacherId,
      });
      
      if (student.photoUrl) {
        setPhotoUrl(student.photoUrl);
      }
    }
  }, [student, form]);

  // Handle form submission
  const onSubmit = (data: StudentFormValues) => {
    // Add photo URL to form data
    const formData = {
      ...data,
      photoUrl,
    };
    
    if (studentId) {
      updateStudentMutation.mutate(formData);
    } else {
      createStudentMutation.mutate(formData);
    }
  };

  // Handle photo upload
  const handlePhotoChange = (url: string) => {
    setPhotoUrl(url);
    form.setValue("photoUrl", url);
  };

  // Determine if fields should be disabled based on user role and loading states
  const isFormDisabled = 
    loadingStudent || 
    createStudentMutation.isPending || 
    updateStudentMutation.isPending;

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
          {studentId ? "Edit Student" : "Add New Student"}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {loadingStudent ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 flex flex-col items-center">
                  <FormLabel className="mb-2">Student Photo</FormLabel>
                  <CloudinaryUpload
                    value={photoUrl}
                    onChange={handlePhotoChange}
                    className="w-full"
                  />
                  <FormDescription className="text-center mt-2">
                    Upload a photo of the student (max 1MB)
                  </FormDescription>
                </div>
                
                <div className="md:w-2/3 space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter student name" 
                            {...field} 
                            disabled={isFormDisabled}
                          />
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
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              min={3}
                              max={5}
                              placeholder="3-5 years" 
                              {...field} 
                              disabled={isFormDisabled}
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
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isFormDisabled}
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
                  
                  <FormField
                    control={form.control}
                    name="parentContact"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Contact (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter parent phone number" 
                            {...field} 
                            disabled={isFormDisabled}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="learningAbility"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Learning Ability</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isFormDisabled}
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
                          <FormLabel>Writing Speed {form.watch("class") === "Nursery" && "(Optional for Nursery)"}</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            disabled={isFormDisabled}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select speed" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Speed Writing">Speed Writing</SelectItem>
                              <SelectItem value="Slow Writing">Slow Writing</SelectItem>
                              <SelectItem value="N/A">Not Applicable</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  {user?.role === "admin" && (
                    <FormField
                      control={form.control}
                      name="teacherId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assign Teacher</FormLabel>
                          <Select 
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                            defaultValue={field.value?.toString()}
                            disabled={isFormDisabled || loadingTeachers}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select teacher" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Unassigned</SelectItem>
                              {teachers?.map((teacher: any) => (
                                <SelectItem 
                                  key={teacher.id} 
                                  value={teacher.id.toString()}
                                  disabled={!teacher.assignedClasses.includes(form.watch("class"))}
                                >
                                  {teacher.name} ({teacher.assignedClasses.join(", ")})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Only teachers assigned to this class can be selected
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add any additional notes about the student" 
                            rows={3}
                            {...field} 
                            disabled={isFormDisabled}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
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
                      {studentId ? "Updating..." : "Saving..."}
                    </>
                  ) : (
                    studentId ? "Update Student" : "Save Student"
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
