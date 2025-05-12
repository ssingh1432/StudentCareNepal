import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Student, insertStudentSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { uploadImage } from "@/lib/cloudinary";
import { z } from "zod";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload } from "lucide-react";

interface StudentFormProps {
  student: Student | null;
  onSaved: () => void;
  onCancel: () => void;
}

// Extend the schema to include the file field
const extendedSchema = insertStudentSchema.extend({
  photoFile: z.instanceof(File).optional(),
});

type StudentFormValues = z.infer<typeof extendedSchema>;

export function StudentForm({ student, onSaved, onCancel }: StudentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const isAdmin = user?.role === "admin";
  
  // Query teachers
  const { data: teachers } = useQuery({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const res = await fetch("/api/teachers");
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json();
    },
    enabled: isAdmin, // Only fetch teachers if user is admin
  });
  
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      name: student?.name || "",
      age: student?.age || 3,
      class: student?.class || "Nursery",
      parentContact: student?.parentContact || "",
      learningAbility: student?.learningAbility || "Average",
      writingSpeed: student?.writingSpeed || "Not Applicable",
      notes: student?.notes || "",
      teacherId: student?.teacherId || (user?.role === "teacher" ? user.id : undefined),
      photoUrl: student?.photoUrl || "",
      photoFile: undefined,
    },
  });
  
  // Set photo preview if student has a photo
  useEffect(() => {
    if (student?.photoUrl) {
      setPhotoPreview(student.photoUrl);
    }
  }, [student]);
  
  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 1MB",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file type
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only JPEG and PNG files are allowed",
        variant: "destructive",
      });
      return;
    }
    
    // Set file in form and create preview
    form.setValue("photoFile", file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Create/update student mutation
  const mutation = useMutation({
    mutationFn: async (data: StudentFormValues) => {
      let photoUrl = data.photoUrl;
      
      // Upload photo if provided
      if (data.photoFile) {
        setIsUploading(true);
        try {
          const result = await uploadImage(data.photoFile, {
            folder: "students",
          });
          photoUrl = result.url;
        } catch (error) {
          console.error("Error uploading image:", error);
          throw new Error("Failed to upload image. Please try again.");
        } finally {
          setIsUploading(false);
        }
      }
      
      // Create or update student
      const studentData = {
        ...data,
        photoUrl,
      };
      
      // Remove photoFile as it's not part of the API schema
      delete (studentData as any).photoFile;
      
      if (student) {
        // Update existing student
        const res = await apiRequest("PUT", `/api/students/${student.id}`, studentData);
        return res.json();
      } else {
        // Create new student
        const res = await apiRequest("POST", "/api/students", studentData);
        return res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: student ? "Student updated" : "Student created",
        description: student 
          ? `${student.name} has been updated successfully.` 
          : "New student has been created successfully.",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      
      onSaved();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Submit handler
  const onSubmit = (data: StudentFormValues) => {
    mutation.mutate(data);
  };
  
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">
        {student ? `Edit ${student.name}` : "Add New Student"}
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter student name" />
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
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={3} 
                      max={5} 
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Pre-primary students are typically 3-5 years old
                  </FormDescription>
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
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nursery">Nursery (~3 years)</SelectItem>
                        <SelectItem value="LKG">LKG (~4 years)</SelectItem>
                        <SelectItem value="UKG">UKG (~5 years)</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                    <Input {...field} placeholder="Enter parent phone number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="learningAbility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Learning Ability</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select learning ability" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Talented">Talented</SelectItem>
                        <SelectItem value="Average">Average</SelectItem>
                        <SelectItem value="Slow Learner">Slow Learner</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select writing speed" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Speed Writing">Speed Writing</SelectItem>
                        <SelectItem value="Slow Writing">Slow Writing</SelectItem>
                        <SelectItem value="Not Applicable">Not Applicable</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    For Nursery students, you may select "Not Applicable"
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
                  <FormControl>
                    <Select 
                      value={field.value?.toString()} 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers?.map((teacher: any) => (
                          <SelectItem key={teacher.id} value={teacher.id.toString()}>
                            {teacher.name}
                            {teacher.classes?.length ? ` (${teacher.classes.join(", ")})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <FormField
            control={form.control}
            name="photoFile"
            render={({ field: { value, onChange, ...field } }) => (
              <FormItem>
                <FormLabel>Photo (Optional)</FormLabel>
                <div className="flex items-center space-x-4">
                  {photoPreview ? (
                    <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100">
                      <img 
                        src={photoPreview} 
                        alt="Student preview" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">No Photo</span>
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleFileChange}
                      className="hidden"
                      id="student-photo"
                      {...field}
                    />
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById("student-photo")?.click()}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {photoPreview ? "Change Photo" : "Upload Photo"}
                    </Button>
                    <FormDescription className="mt-1">
                      JPEG or PNG, max 1MB
                    </FormDescription>
                  </div>
                </div>
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
                    {...field} 
                    placeholder="Add any additional notes about the student"
                    rows={3}
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
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending || isUploading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {(mutation.isPending || isUploading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {student ? "Update Student" : "Add Student"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
