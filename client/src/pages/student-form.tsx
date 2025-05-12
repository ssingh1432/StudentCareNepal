import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft,
  Loader2,
  Upload,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { classOptions, learningAbilityOptions, writingSpeedOptions } from "@shared/schema";

// Form schema for student
const studentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().int().min(3, "Age must be at least 3").max(5, "Age must be at most 5"),
  class: z.enum(["Nursery", "LKG", "UKG"]),
  parentContact: z.string().optional(),
  learningAbility: z.enum(["Talented", "Average", "Slow Learner"]),
  writingSpeed: z.enum(["Speed Writing", "Slow Writing", "N/A"]),
  notes: z.string().optional(),
  teacherId: z.number().nullable(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

export default function StudentForm({ id }: { id?: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const isEditMode = !!id;
  
  // Fetch student data if in edit mode
  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: [`/api/students/${id}`],
    enabled: isEditMode && !!id,
  });
  
  // Fetch teachers for assignment
  const { data: teachers, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['/api/teachers'],
    enabled: user?.role === 'admin',
  });
  
  // Form setup
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
      teacherId: null,
    },
  });
  
  // Update form values when student data is loaded
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
        teacherId: student.teacherId,
      });
      
      if (student.photoUrl) {
        setPhotoPreview(student.photoUrl);
      }
    }
  }, [student, form]);
  
  // Create student mutation
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      let photoUrl = null;
      let photoPublicId = null;
      
      // Handle photo upload if present
      if (photoFile) {
        setIsUploading(true);
        try {
          const result = await uploadToCloudinary(photoFile);
          photoUrl = result.secure_url;
          photoPublicId = result.public_id;
        } catch (error) {
          console.error("Error uploading photo:", error);
          throw new Error("Failed to upload photo. Please try again.");
        } finally {
          setIsUploading(false);
        }
      }
      
      // Create student with photo info
      const studentData = {
        ...data,
        photoUrl,
        photoPublicId,
      };
      
      const response = await apiRequest(
        "POST",
        "/api/students",
        studentData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      navigate("/students");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create student: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update student mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      let photoUrl = student?.photoUrl;
      let photoPublicId = student?.photoPublicId;
      
      // Handle photo upload if present
      if (photoFile) {
        setIsUploading(true);
        try {
          const result = await uploadToCloudinary(photoFile);
          photoUrl = result.secure_url;
          photoPublicId = result.public_id;
        } catch (error) {
          console.error("Error uploading photo:", error);
          throw new Error("Failed to upload photo. Please try again.");
        } finally {
          setIsUploading(false);
        }
      }
      
      // Update student with photo info
      const studentData = {
        ...data,
        photoUrl,
        photoPublicId,
      };
      
      const response = await apiRequest(
        "PUT",
        `/api/students/${id}`,
        studentData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/students/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      navigate("/students");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update student: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (values: StudentFormValues) => {
    if (isEditMode) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };
  
  // Handle photo change
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 1MB)
      if (file.size > 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Photo must be less than 1MB",
          variant: "destructive",
        });
        return;
      }
      
      // Check file type
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Only JPEG and PNG images are allowed",
          variant: "destructive",
        });
        return;
      }
      
      setPhotoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Check if user is authorized
  if (!user) return null;
  
  const isAdmin = user.role === 'admin';
  const isPending = createMutation.isPending || updateMutation.isPending || isUploading;
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={isEditMode ? "Edit Student" : "Add New Student"}
          onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6">
            <Button
              variant="outline"
              onClick={() => navigate("/students")}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Students
            </Button>
            
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditMode ? "Edit Student" : "Add New Student"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {isEditMode ? "Update student information" : "Enter details to register a new student"}
            </p>
          </div>
          
          {isEditMode && isLoadingStudent ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-64 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent className="space-y-4">
                {Array(6).fill(null).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{isEditMode ? "Edit Student Information" : "Student Information"}</CardTitle>
                <CardDescription>
                  Fill in the following details for the pre-primary student.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter student name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="grid grid-cols-2 gap-4">
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
                                    placeholder="Age"
                                    {...field}
                                  />
                                </FormControl>
                                <FormDescription>Age between 3-5 years</FormDescription>
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
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select class" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {classOptions.map((option) => (
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
                        
                        <div className="grid grid-cols-2 gap-4">
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
                                    {learningAbilityOptions.map((option) => (
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
                            name="writingSpeed"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Writing Speed</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                  value={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select speed" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {writingSpeedOptions.map((option) => (
                                      <SelectItem key={option} value={option}>
                                        {option}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormDescription>
                                  {form.watch("class") === "Nursery" && "Optional for Nursery students"}
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        {isAdmin && (
                          <FormField
                            control={form.control}
                            name="teacherId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Assign Teacher</FormLabel>
                                <Select
                                  onValueChange={(value) => field.onChange(value ? parseInt(value) : null)}
                                  value={field.value?.toString() || ''}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select teacher" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="">Unassigned</SelectItem>
                                    {isLoadingTeachers ? (
                                      <SelectItem value="" disabled>Loading teachers...</SelectItem>
                                    ) : (
                                      teachers?.map((teacher: any) => (
                                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                          {teacher.name} ({teacher.assignedClasses.join(", ")})
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <FormLabel>Student Photo</FormLabel>
                          <div className="mt-2 flex flex-col items-center">
                            {photoPreview ? (
                              <div className="mb-4">
                                <img
                                  src={photoPreview}
                                  alt="Student preview"
                                  className="h-40 w-40 rounded-full object-cover border-4 border-white shadow-md"
                                />
                              </div>
                            ) : (
                              <div className="mb-4 h-40 w-40 rounded-full bg-gray-200 flex items-center justify-center text-gray-400 border-4 border-white shadow-md">
                                <User className="h-20 w-20" />
                              </div>
                            )}
                            
                            <label htmlFor="photo-upload" className="cursor-pointer">
                              <div className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                <Upload className="mr-2 h-4 w-4" />
                                {photoPreview ? "Change Photo" : "Upload Photo"}
                              </div>
                              <input
                                id="photo-upload"
                                type="file"
                                className="sr-only"
                                accept="image/jpeg,image/png"
                                onChange={handlePhotoChange}
                                disabled={isPending}
                              />
                            </label>
                            <p className="mt-1 text-xs text-gray-500">
                              JPEG or PNG. Max 1MB.
                            </p>
                          </div>
                        </div>
                        
                        <FormField
                          control={form.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes (Optional)</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Additional notes about the student"
                                  className="h-40 resize-none"
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
                        disabled={isPending}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={isPending}
                      >
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditMode ? "Update Student" : "Add Student"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
