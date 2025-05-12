import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Student, insertStudentSchema } from "@shared/schema";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

interface StudentFormProps {
  initialData?: Partial<Student>;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEditMode?: boolean;
}

export function StudentForm({
  initialData,
  onSuccess,
  onCancel,
  isEditMode = false,
}: StudentFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Extended schema with file validation
  const formSchema = insertStudentSchema;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      age: initialData?.age || 3,
      classType: initialData?.classType || "nursery",
      parentContact: initialData?.parentContact || "",
      learningAbility: initialData?.learningAbility || "average",
      writingSpeed: initialData?.writingSpeed || "not_applicable",
      notes: initialData?.notes || "",
      assignedTeacherId: initialData?.assignedTeacherId || undefined,
    },
  });

  // Fetch teachers for admin selection
  const { data: teachers = [] } = useQuery<any[]>({
    queryKey: ["/api/teachers"],
    enabled: user?.role === "admin",
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      
      // Add student data as JSON
      formData.append("data", JSON.stringify(data));
      
      // Add file if selected
      if (selectedFile) {
        formData.append("photo", selectedFile);
      }

      if (isEditMode && initialData?.id) {
        // Update existing student with multipart form
        const res = await fetch(`/api/students/${initialData.id}`, {
          method: "PATCH",
          body: formData,
          credentials: "include",
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to update student");
        }
      } else {
        // Create new student with multipart form
        const res = await fetch("/api/students", {
          method: "POST",
          body: formData,
          credentials: "include",
        });
        
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to create student");
        }
      }

      // Invalidate students query
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });

      toast({
        title: isEditMode ? "Student updated" : "Student created",
        description: isEditMode
          ? "The student has been updated successfully"
          : "The student has been created successfully",
      });

      // Call success callback
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileClear = () => {
    setSelectedFile(null);
  };

  return (
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
                    <Input placeholder="Student name" {...field} />
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
                      onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="nursery">Nursery</SelectItem>
                      <SelectItem value="lkg">LKG</SelectItem>
                      <SelectItem value="ukg">UKG</SelectItem>
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
                    <Input placeholder="Parent phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <FormField
              control={form.control}
              name="learningAbility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Learning Ability</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ability" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="talented">Talented</SelectItem>
                      <SelectItem value="average">Average</SelectItem>
                      <SelectItem value="slow_learner">Slow Learner</SelectItem>
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
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select writing speed" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="speed_writing">Speed Writing</SelectItem>
                      <SelectItem value="slow_writing">Slow Writing</SelectItem>
                      <SelectItem value="not_applicable">Not Applicable</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {user?.role === "admin" && (
              <FormField
                control={form.control}
                name="assignedTeacherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Teacher</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value, 10))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teachers.map((teacher: any) => (
                          <SelectItem key={teacher.user.id} value={teacher.user.id.toString()}>
                            {teacher.user.name} ({teacher.assignedClasses.map((c: string) => c.toUpperCase()).join(", ")})
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
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about the student"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-4">
          <FormLabel>Student Photo</FormLabel>
          <FileUpload
            onFileSelect={handleFileSelect}
            onFileClear={handleFileClear}
            accept="image/jpeg, image/png"
            maxSize={1024 * 1024} // 1MB
            previewUrl={initialData?.photoUrl}
          />
        </div>

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEditMode ? "Update Student" : "Add Student"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
