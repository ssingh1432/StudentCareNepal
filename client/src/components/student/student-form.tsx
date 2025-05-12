import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Student, studentSchema, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { z } from "zod";
import { useState } from "react";
import { uploadToCloudinary } from "@/lib/cloudinary";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Loader2, Upload, User as UserIcon } from "lucide-react";

interface StudentFormProps {
  student: Student | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function StudentForm({ student, onClose, onSuccess }: StudentFormProps) {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string>(student?.photoUrl || "");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Setup form validation schema
  const formSchema = studentSchema
    .omit({ photoUrl: true, teacherId: true }) // We'll handle these separately
    .refine((data) => {
      // For Nursery, writing speed can be N/A
      if (data.class === "Nursery" && data.writingSpeed !== "N/A") {
        return false;
      }
      return true;
    }, {
      message: "Nursery students should have N/A for writing speed",
      path: ["writingSpeed"],
    });

  // Get form methods
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: student
      ? {
          name: student.name,
          age: student.age,
          class: student.class,
          parentContact: student.parentContact || "",
          learningAbility: student.learningAbility,
          writingSpeed: student.writingSpeed,
          notes: student.notes || "",
        }
      : {
          name: "",
          age: 3,
          class: "Nursery",
          parentContact: "",
          learningAbility: "Average",
          writingSpeed: "N/A",
          notes: "",
        },
  });

  // Watch the class field to update writing speed
  const classValue = form.watch("class");
  if (classValue === "Nursery" && form.getValues("writingSpeed") !== "N/A") {
    form.setValue("writingSpeed", "N/A");
  }

  // Fetch teachers for dropdown (admin only)
  const { data: teachers } = useQuery<User[]>({
    queryKey: ["/api/admin/teachers"],
    enabled: isAdmin,
  });

  // Create or update student mutation
  const studentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema> & { photoUrl?: string; teacherId: number }) => {
      if (student) {
        // Update existing student
        await apiRequest("PUT", `/api/protected/students/${student.id}`, data);
      } else {
        // Create new student
        await apiRequest("POST", "/api/protected/students", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/students"] });
      toast({
        title: student ? "Student updated" : "Student created",
        description: student
          ? "Student has been updated successfully"
          : "New student has been added successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${student ? "update" : "create"} student: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle photo upload
  const handlePhotoUpload = async (file: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);

      const result = await uploadToCloudinary(file, {
        maxSizeMB: 1,
        onProgress: (progress) => setUploadProgress(progress),
      });

      setPhotoUrl(result.secureUrl);
      toast({
        title: "Photo uploaded",
        description: "Photo has been uploaded successfully",
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload photo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    // Determine teacher ID
    let teacherId = user?.id || 0;
    
    // If admin and a teacher is selected
    if (isAdmin && form.getValues("teacherId")) {
      teacherId = parseInt(form.getValues("teacherId"));
    } else if (student) {
      // Keep existing teacher ID for updates
      teacherId = student.teacherId;
    }

    // Include photo URL if available
    const studentData = {
      ...data,
      photoUrl,
      teacherId,
    };

    studentMutation.mutate(studentData);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{student ? "Edit Student" : "Add New Student"}</CardTitle>
        <CardDescription>
          {student
            ? "Update student information and details"
            : "Enter information to register a new student"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Student's full name" />
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
                      <Input
                        type="number"
                        min={3}
                        max={5}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Age must be between 3-5 years</FormDescription>
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

              <FormField
                control={form.control}
                name="parentContact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Contact (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Parent's phone number" />
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
                      disabled={classValue === "Nursery"}
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
                    {classValue === "Nursery" && (
                      <FormDescription>
                        Writing speed is set to N/A for Nursery students
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAdmin && (
                <div className="md:col-span-2">
                  <FormLabel>Assign Teacher</FormLabel>
                  <Select
                    onValueChange={(value) => form.setValue("teacherId", value)}
                    defaultValue={student?.teacherId.toString()}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {teachers?.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </div>
              )}

              <div className="md:col-span-2">
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Any additional notes about the student"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="md:col-span-2">
                <Label>Photo</Label>
                <div className="mt-2 flex items-center">
                  <div className="flex-shrink-0 h-20 w-20 rounded-full overflow-hidden bg-gray-100 mr-4">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Student photo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <UserIcon className="h-12 w-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Label
                      htmlFor="photo-upload"
                      className="cursor-pointer bg-white hover:bg-gray-50 text-purple-600 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium focus:outline-none"
                    >
                      {isUploading ? (
                        <div className="flex items-center">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading... {uploadProgress}%
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Photo
                        </div>
                      )}
                    </Label>
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/jpeg, image/png"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setPhotoFile(file);
                          handlePhotoUpload(file);
                        }
                      }}
                      disabled={isUploading}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Maximum file size: 1MB. Formats: JPEG, PNG
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={studentMutation.isPending || isUploading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={studentMutation.isPending || isUploading}
              >
                {studentMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {student ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{student ? "Update Student" : "Add Student"}</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
