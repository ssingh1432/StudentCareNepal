import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Student, ClassLevel, LearningAbility, WritingSpeed } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Form validation schema
const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().int().min(3, "Age must be at least 3").max(6, "Age must be at most 6"),
  class: z.enum(["Nursery", "LKG", "UKG"]),
  parentContact: z.string().optional().nullable(),
  learningAbility: z.enum(["Talented", "Average", "Slow Learner"]),
  writingSpeed: z.enum(["Slow Writing", "Speed Writing"]).optional().nullable(),
  notes: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
  teacherId: z.coerce.number().int().positive("Teacher assignment is required"),
});

export type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  student?: Student | null;
  teachers: { id: number; name: string; assignedClasses: string[] }[];
  onClose: () => void;
}

export default function StudentForm({ student, teachers, onClose }: StudentFormProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>(student?.class || "Nursery");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form default values
  const defaultValues: StudentFormValues = {
    name: student?.name || "",
    age: student?.age || 3,
    class: (student?.class as "Nursery" | "LKG" | "UKG") || "Nursery",
    parentContact: student?.parentContact || "",
    learningAbility: (student?.learningAbility as "Talented" | "Average" | "Slow Learner") || "Average",
    writingSpeed: (student?.writingSpeed as "Slow Writing" | "Speed Writing" | null) || null,
    notes: student?.notes || "",
    photoUrl: student?.photoUrl || "",
    teacherId: student?.teacherId || 0,
  };
  
  // Initialize form
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues,
  });
  
  // Watch the class field to conditionally show writing speed
  const watchedClass = form.watch("class");
  
  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: async (values: StudentFormValues) => {
      if (file) {
        const formData = new FormData();
        formData.append("photo", file);
        
        try {
          setIsUploading(true);
          const uploadResponse = await fetch("/api/upload-photo", {
            method: "POST",
            body: formData,
            credentials: "include",
          });
          
          if (!uploadResponse.ok) {
            throw new Error("Failed to upload photo");
          }
          
          const { url } = await uploadResponse.json();
          values.photoUrl = url;
        } catch (error) {
          console.error("Error uploading photo:", error);
          toast({
            title: "Photo Upload Failed",
            description: "Failed to upload photo, but student data will be saved",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }
      
      const response = await apiRequest("POST", "/api/students", values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student added",
        description: "New student has been added successfully",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add student: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: async (values: StudentFormValues) => {
      if (!student?.id) throw new Error("Student ID is required for update");
      
      if (file) {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("studentId", student.id.toString());
        
        try {
          setIsUploading(true);
          const uploadResponse = await fetch("/api/upload-photo", {
            method: "POST",
            body: formData,
            credentials: "include",
          });
          
          if (!uploadResponse.ok) {
            throw new Error("Failed to upload photo");
          }
          
          const { url } = await uploadResponse.json();
          values.photoUrl = url;
        } catch (error) {
          console.error("Error uploading photo:", error);
          toast({
            title: "Photo Upload Failed",
            description: "Failed to upload photo, but student data will be updated",
            variant: "destructive",
          });
        } finally {
          setIsUploading(false);
        }
      }
      
      const response = await apiRequest("PUT", `/api/students/${student.id}`, values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student updated",
        description: "Student information has been updated successfully",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update student: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: StudentFormValues) => {
    // If class is Nursery, ensure writingSpeed is null
    if (values.class === "Nursery") {
      values.writingSpeed = null;
    }
    
    if (student?.id) {
      updateStudentMutation.mutate(values);
    } else {
      createStudentMutation.mutate(values);
    }
  };
  
  // Handle file selection
  const handleFileChange = (selectedFile: File | null) => {
    setFile(selectedFile);
  };
  
  // Handle class change
  const handleClassChange = (value: string) => {
    setSelectedClass(value as "Nursery" | "LKG" | "UKG");
    form.setValue("class", value as "Nursery" | "LKG" | "UKG");
    
    // If changed to Nursery, clear writing speed
    if (value === "Nursery") {
      form.setValue("writingSpeed", null);
    }
  };
  
  // Dialog close handler
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for dialog animation
  };
  
  // Get form error message
  const getErrorMessage = (field: keyof StudentFormValues): string => {
    return form.formState.errors[field]?.message || "";
  };
  
  // Filter teachers by assigned classes
  const eligibleTeachers = teachers.filter(
    teacher => teacher.assignedClasses && teacher.assignedClasses.includes(selectedClass)
  );
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{student?.id ? "Edit Student" : "Add New Student"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Photo Upload */}
          <div className="space-y-2">
            <Label>Student Photo</Label>
            <div className="flex items-center space-x-4">
              {student?.photoUrl ? (
                <div className="relative w-24 h-24">
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    className="w-24 h-24 rounded-lg object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&size=96&background=random`;
                    }}
                  />
                </div>
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500">No Photo</span>
                </div>
              )}
              
              <div className="flex-1">
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a clear photo of the student (optional)
                </p>
              </div>
            </div>
          </div>
          
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input 
              id="name" 
              {...form.register("name")}
              placeholder="Student's full name" 
            />
            {getErrorMessage("name") && (
              <p className="text-sm text-red-500">{getErrorMessage("name")}</p>
            )}
          </div>
          
          {/* Age and Class (side by side) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input 
                id="age" 
                type="number" 
                min={3} 
                max={6}
                {...form.register("age")}
              />
              {getErrorMessage("age") && (
                <p className="text-sm text-red-500">{getErrorMessage("age")}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select
                value={form.watch("class")}
                onValueChange={handleClassChange}
              >
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nursery">Nursery</SelectItem>
                  <SelectItem value="LKG">LKG</SelectItem>
                  <SelectItem value="UKG">UKG</SelectItem>
                </SelectContent>
              </Select>
              {getErrorMessage("class") && (
                <p className="text-sm text-red-500">{getErrorMessage("class")}</p>
              )}
            </div>
          </div>
          
          {/* Parent Contact */}
          <div className="space-y-2">
            <Label htmlFor="parentContact">Parent Contact</Label>
            <Input 
              id="parentContact" 
              {...form.register("parentContact")}
              placeholder="Parent's phone number or email" 
            />
            {getErrorMessage("parentContact") && (
              <p className="text-sm text-red-500">{getErrorMessage("parentContact")}</p>
            )}
          </div>
          
          {/* Learning Ability */}
          <div className="space-y-2">
            <Label htmlFor="learningAbility">Learning Ability</Label>
            <Select
              value={form.watch("learningAbility")}
              onValueChange={(value) => form.setValue("learningAbility", value as "Talented" | "Average" | "Slow Learner")}
            >
              <SelectTrigger id="learningAbility">
                <SelectValue placeholder="Select learning ability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Talented">Talented</SelectItem>
                <SelectItem value="Average">Average</SelectItem>
                <SelectItem value="Slow Learner">Slow Learner</SelectItem>
              </SelectContent>
            </Select>
            {getErrorMessage("learningAbility") && (
              <p className="text-sm text-red-500">{getErrorMessage("learningAbility")}</p>
            )}
          </div>
          
          {/* Writing Speed (only for LKG and UKG) */}
          {watchedClass !== "Nursery" && (
            <div className="space-y-2">
              <Label htmlFor="writingSpeed">Writing Speed</Label>
              <Select
                value={form.watch("writingSpeed") || ""}
                onValueChange={(value) => form.setValue("writingSpeed", value as "Slow Writing" | "Speed Writing")}
              >
                <SelectTrigger id="writingSpeed">
                  <SelectValue placeholder="Select writing speed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Slow Writing">Slow Writing</SelectItem>
                  <SelectItem value="Speed Writing">Speed Writing</SelectItem>
                </SelectContent>
              </Select>
              {getErrorMessage("writingSpeed") && (
                <p className="text-sm text-red-500">{getErrorMessage("writingSpeed")}</p>
              )}
            </div>
          )}
          
          {/* Teacher Assignment */}
          <div className="space-y-2">
            <Label htmlFor="teacherId">Assign Teacher</Label>
            <Select
              value={form.watch("teacherId")?.toString() || ""}
              onValueChange={(value) => form.setValue("teacherId", parseInt(value))}
            >
              <SelectTrigger id="teacherId">
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                {eligibleTeachers.length === 0 ? (
                  <SelectItem value="" disabled>
                    No teachers assigned to this class
                  </SelectItem>
                ) : (
                  eligibleTeachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {getErrorMessage("teacherId") && (
              <p className="text-sm text-red-500">{getErrorMessage("teacherId")}</p>
            )}
            {eligibleTeachers.length === 0 && (
              <p className="text-xs text-amber-500">
                No teachers are assigned to {selectedClass}. Please assign teachers to this class first.
              </p>
            )}
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              rows={3}
              {...form.register("notes")}
              placeholder="Any additional information about the student"
            />
            {getErrorMessage("notes") && (
              <p className="text-sm text-red-500">{getErrorMessage("notes")}</p>
            )}
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createStudentMutation.isPending || updateStudentMutation.isPending || isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createStudentMutation.isPending || updateStudentMutation.isPending || isUploading}
            >
              {(createStudentMutation.isPending || updateStudentMutation.isPending || isUploading) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isUploading ? "Uploading..." : student?.id ? "Update Student" : "Add Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}