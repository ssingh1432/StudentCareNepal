import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertStudentSchema } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { validateImage, handleImageUpload } from "@/lib/cloudinary";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Upload } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().min(3, "Age must be at least 3").max(5, "Age must be at most 5"),
  class: z.enum(["Nursery", "LKG", "UKG"]),
  parentContact: z.string().optional(),
  learningAbility: z.enum(["Talented", "Average", "Slow Learner"]),
  writingSpeed: z.enum(["Speed Writing", "Slow Writing", "N/A"]),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
  teacherId: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface StudentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: FormValues;
  isEditing?: boolean;
}

export default function StudentForm({ onSuccess, onCancel, initialData, isEditing = false }: StudentFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photoUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Fetch teachers for admin user
  const { data: teachers = [] } = useQuery({
    queryKey: ["/api/teachers"],
    enabled: isAdmin,
  });
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      age: 4,
      class: "LKG",
      parentContact: "",
      learningAbility: "Average",
      writingSpeed: "N/A",
      notes: "",
      photoUrl: "",
      teacherId: isAdmin ? undefined : user?.id,
    },
  });
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate the image
    const validation = validateImage(file);
    if (!validation.valid) {
      toast({
        title: "Invalid image",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }
    
    // Set the file for upload
    setPhotoFile(file);
    
    // Create a preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const onSubmit = async (values: FormValues) => {
    try {
      setIsUploading(true);
      
      // If there's a new photo file, upload it
      if (photoFile) {
        try {
          const photoUrl = await handleImageUpload(photoFile, initialData?.photoUrl);
          values.photoUrl = photoUrl;
        } catch (error) {
          console.error("Error uploading image:", error);
          toast({
            title: "Upload Failed",
            description: "Failed to upload student photo. Please try again.",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }
      } else if (photoPreview && photoPreview !== initialData?.photoUrl) {
        // If there's a preview URL but no file (e.g., from data URL in offline mode)
        values.photoUrl = photoPreview;
      }
      
      // Submit the form data
      const endpoint = isEditing 
        ? `/api/students/${initialData?.id}` 
        : "/api/students";
      
      const method = isEditing ? "PUT" : "POST";
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save student data");
      }
      
      toast({
        title: isEditing ? "Student Updated" : "Student Added",
        description: `Successfully ${isEditing ? "updated" : "added"} ${values.name}.`,
      });
      
      onSuccess();
    } catch (error) {
      console.error("Error saving student:", error);
      toast({
        title: "Error",
        description: "Failed to save student data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Student" : "Add New Student"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex flex-col items-center justify-center mb-4">
                <div className="relative">
                  {photoPreview ? (
                    <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-purple-200">
                      <img 
                        src={photoPreview} 
                        alt="Student preview" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center">
                      <User className="h-12 w-12 text-purple-600" />
                    </div>
                  )}
                  <label 
                    htmlFor="photo-upload" 
                    className="absolute bottom-0 right-0 bg-purple-600 rounded-full p-1 cursor-pointer text-white"
                  >
                    <Upload size={16} />
                  </label>
                  <input 
                    id="photo-upload" 
                    type="file" 
                    accept="image/jpeg, image/png" 
                    className="hidden" 
                    onChange={handleFileChange}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Upload student photo (JPEG/PNG, max 1MB)
                </p>
              </div>
            
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
              
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input type="number" min={3} max={5} {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                name="learningAbility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Learning Ability</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select learning ability" />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select writing speed" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Speed Writing">Speed Writing</SelectItem>
                        <SelectItem value="Slow Writing">Slow Writing</SelectItem>
                        <SelectItem value="N/A">N/A (for Nursery)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {isAdmin && (
                <FormField
                  control={form.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign Teacher</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString() || ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers.map((teacher: any) => (
                            <SelectItem key={teacher.id} value={teacher.id.toString()}>
                              {teacher.name} ({teacher.assignedClasses.join(", ")})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any relevant notes about the student" 
                        rows={3} 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <CardFooter className="flex justify-end space-x-2 px-0">
              <Button variant="outline" onClick={onCancel} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={isUploading}>
                {isUploading ? "Saving..." : (isEditing ? "Update Student" : "Add Student")}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
