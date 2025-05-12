import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { classLevels } from "@shared/schema";

interface TeacherFormProps {
  teacherId?: number;
  isResetPassword?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

export function TeacherForm({ teacherId, isResetPassword = false, onSuccess, onCancel }: TeacherFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Define schemas based on operation
  const teacherFormSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    email: z.string().email({ message: "Please enter a valid email address" }),
    password: teacherId && !isResetPassword
      ? z.string().optional()
      : z.string().min(6, { message: "Password must be at least 6 characters" }),
    confirmPassword: teacherId && !isResetPassword
      ? z.string().optional()
      : z.string().min(6, { message: "Confirm password must be at least 6 characters" }),
    classes: z.array(z.string()).min(1, { message: "Please assign at least one class" }),
  }).refine((data) => {
    // Only check password match if password is provided or it's required
    if (!data.password && teacherId && !isResetPassword) return true;
    return data.password === data.confirmPassword;
  }, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  });

  // Query to fetch teacher data if editing
  const { data: teacherData, isLoading: isLoadingTeacher } = useQuery({
    queryKey: ['/api/teachers', teacherId],
    enabled: !!teacherId && !isResetPassword,
  });

  // Form hook
  const form = useForm<z.infer<typeof teacherFormSchema>>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      classes: [],
    },
  });

  // Update form when teacher data is loaded
  if (teacherData && !form.formState.isDirty && !isResetPassword) {
    form.reset({
      name: teacherData.name,
      email: teacherData.email,
      password: "",
      confirmPassword: "",
      classes: teacherData.classes || [],
    });
  }

  // Create/Update/Reset password mutation
  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof teacherFormSchema>) => {
      // Remove confirmPassword as it's not needed in the API
      const { confirmPassword, ...apiData } = data;
      
      if (isResetPassword && teacherId) {
        return apiRequest("POST", `/api/teachers/${teacherId}/reset-password`, { 
          password: data.password 
        });
      } else if (teacherId) {
        return apiRequest("PUT", `/api/teachers/${teacherId}`, apiData);
      } else {
        return apiRequest("POST", "/api/teachers", apiData);
      }
    },
    onSuccess: () => {
      let message = isResetPassword 
        ? "Password has been reset successfully" 
        : `Teacher ${teacherId ? "updated" : "created"} successfully`;
      
      toast({
        title: "Success",
        description: message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      onSuccess();
    },
    onError: (error) => {
      let action = isResetPassword 
        ? "reset password" 
        : (teacherId ? "update" : "create") + " teacher";
      
      toast({
        title: "Error",
        description: `Failed to ${action}: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof teacherFormSchema>) => {
    mutation.mutate(data);
  };

  const isLoading = isLoadingTeacher || mutation.isPending;
  
  // Determine title based on operation
  let formTitle = isResetPassword 
    ? "Reset Password" 
    : (teacherId ? "Edit Teacher" : "Add New Teacher");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <h3 className="text-lg font-medium text-gray-900">{formTitle}</h3>
        
        {!isResetPassword && (
          <>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter teacher's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter email address" 
                      {...field} 
                      disabled={!!teacherId} // Email can't be changed after creation
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isResetPassword ? "New Password" : "Password"}</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder={isResetPassword ? "Enter new password" : teacherId ? "Leave blank to keep current password" : "Enter password"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isResetPassword ? "Confirm New Password" : "Confirm Password"}</FormLabel>
              <FormControl>
                <Input 
                  type="password" 
                  placeholder={isResetPassword ? "Confirm new password" : teacherId ? "Leave blank to keep current password" : "Confirm password"} 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isResetPassword && (
          <FormField
            control={form.control}
            name="classes"
            render={() => (
              <FormItem>
                <div className="mb-4">
                  <FormLabel>Assign Classes</FormLabel>
                </div>
                <div className="flex flex-col space-y-2">
                  {classLevels.map((level) => (
                    <FormField
                      key={level}
                      control={form.control}
                      name="classes"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={level}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(level)}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  const newValue = checked
                                    ? [...currentValue, level]
                                    : currentValue.filter((val) => val !== level);
                                  field.onChange(newValue);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {level}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isResetPassword ? "Reset Password" : (teacherId ? "Update" : "Add")} 
          </Button>
        </div>
      </form>
    </Form>
  );
}
