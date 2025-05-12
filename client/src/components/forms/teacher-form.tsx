import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { User } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// Form validation schema
const teacherFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  confirmPassword: z.string().optional(),
  assignedClasses: z.array(z.string()).optional(),
});

// Add confirm password validation
const teacherSchemaWithConfirm = teacherFormSchema.refine(
  (data) => !data.password || data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

export type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface TeacherFormProps {
  teacher?: Omit<TeacherFormValues, 'password' | 'confirmPassword'> & { id?: number };
  onClose: () => void;
}

export default function TeacherForm({ teacher, onClose }: TeacherFormProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  
  // Class options
  const classOptions = [
    { label: "Nursery", value: "Nursery" },
    { label: "LKG", value: "LKG" },
    { label: "UKG", value: "UKG" },
  ];
  
  // Form default values
  const defaultValues: TeacherFormValues = {
    name: teacher?.name || "",
    email: teacher?.email || "",
    password: "",
    confirmPassword: "",
    assignedClasses: teacher?.assignedClasses || [],
  };
  
  // Initialize form
  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchemaWithConfirm),
    defaultValues,
  });
  
  // Create teacher mutation
  const createTeacherMutation = useMutation({
    mutationFn: async (values: TeacherFormValues) => {
      const data = { ...values, role: "teacher" };
      // Remove confirmPassword as it's not part of our API
      const { confirmPassword, ...apiData } = data;
      const response = await apiRequest('POST', '/api/teachers', apiData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      toast({
        title: "Teacher added",
        description: "New teacher has been added successfully",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to add teacher: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update teacher mutation
  const updateTeacherMutation = useMutation({
    mutationFn: async (values: TeacherFormValues) => {
      if (!teacher?.id) throw new Error("Teacher ID is required for update");
      
      // Remove password if it's empty (not being updated)
      const { confirmPassword, password, ...restValues } = values;
      const apiData = password ? { ...restValues, password } : restValues;
      
      const response = await apiRequest('PUT', `/api/teachers/${teacher.id}`, apiData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      toast({
        title: "Teacher updated",
        description: "Teacher information has been updated successfully",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update teacher: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Form submission handler
  const onSubmit = (values: TeacherFormValues) => {
    if (teacher?.id) {
      updateTeacherMutation.mutate(values);
    } else {
      createTeacherMutation.mutate(values);
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
  const getErrorMessage = (field: keyof TeacherFormValues): string => {
    return form.formState.errors[field]?.message || "";
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{teacher?.id ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Teacher's full name"
            />
            {getErrorMessage("name") && (
              <p className="text-sm text-red-500">{getErrorMessage("name")}</p>
            )}
          </div>
          
          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="teacher@example.com"
            />
            {getErrorMessage("email") && (
              <p className="text-sm text-red-500">{getErrorMessage("email")}</p>
            )}
          </div>
          
          {/* Password (only required for new teachers) */}
          <div className="space-y-2">
            <Label htmlFor="password">
              {teacher?.id ? "Password (leave blank to keep current)" : "Password"}
            </Label>
            <Input
              id="password"
              type="password"
              {...form.register("password")}
              placeholder="Minimum 6 characters"
              required={!teacher?.id}
            />
            {getErrorMessage("password") && (
              <p className="text-sm text-red-500">{getErrorMessage("password")}</p>
            )}
          </div>
          
          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...form.register("confirmPassword")}
              placeholder="Confirm password"
              required={!teacher?.id}
            />
            {getErrorMessage("confirmPassword") && (
              <p className="text-sm text-red-500">{getErrorMessage("confirmPassword")}</p>
            )}
          </div>
          
          {/* Assigned Classes */}
          <div className="space-y-2">
            <Label>Assigned Classes</Label>
            <div className="flex flex-col space-y-2">
              {classOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`class-${option.value}`}
                    {...form.register(`assignedClasses.${option.value}`)}
                    checked={form.watch("assignedClasses", []).includes(option.value)}
                    onCheckedChange={(checked) => {
                      const currentClasses = form.watch("assignedClasses", []);
                      if (checked) {
                        form.setValue(
                          "assignedClasses",
                          [...currentClasses, option.value]
                        );
                      } else {
                        form.setValue(
                          "assignedClasses",
                          currentClasses.filter((c) => c !== option.value)
                        );
                      }
                    }}
                  />
                  <Label
                    htmlFor={`class-${option.value}`}
                    className="text-sm font-normal"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createTeacherMutation.isPending || updateTeacherMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createTeacherMutation.isPending || updateTeacherMutation.isPending}
            >
              {(createTeacherMutation.isPending || updateTeacherMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {teacher?.id ? "Update Teacher" : "Add Teacher"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}