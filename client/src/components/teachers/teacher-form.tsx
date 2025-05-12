import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UserForm, userFormSchema } from "@shared/schema";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface TeacherFormProps {
  initialData?: Partial<UserForm>;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEditMode?: boolean;
}

export function TeacherForm({
  initialData,
  onSuccess,
  onCancel,
  isEditMode = false,
}: TeacherFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Create form schema with conditional validation for password
  const formSchema = isEditMode
    ? userFormSchema.omit({ password: true, confirmPassword: true })
    : userFormSchema
        .extend({
          confirmPassword: userFormSchema.shape.password,
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: "Passwords do not match",
          path: ["confirmPassword"],
        });

  const form = useForm<UserForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: initialData?.email || "",
      name: initialData?.name || "",
      role: "teacher",
      assignedClasses: initialData?.assignedClasses || [],
      password: "",
      confirmPassword: "",
    },
  });

  const classOptions = [
    { id: "nursery", label: "Nursery" },
    { id: "lkg", label: "LKG" },
    { id: "ukg", label: "UKG" },
  ];

  const onSubmit = async (data: UserForm) => {
    setIsLoading(true);
    try {
      if (isEditMode && initialData?.id) {
        // Update existing teacher
        await apiRequest("PATCH", `/api/admin/teachers/${initialData.id}`, {
          name: data.name,
          email: data.email,
          assignedClasses: data.assignedClasses,
        });
        toast({
          title: "Teacher updated",
          description: "The teacher has been updated successfully",
        });
      } else {
        // Create new teacher
        await apiRequest("POST", "/api/register", {
          name: data.name,
          email: data.email,
          password: data.password,
          role: "teacher",
          assignedClasses: data.assignedClasses,
        });
        toast({
          title: "Teacher created",
          description: "The teacher has been created successfully",
        });
      }
      
      // Invalidate teachers query
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
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
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="teacher@school.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditMode && (
          <>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
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
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <FormField
          control={form.control}
          name="assignedClasses"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Assign Classes</FormLabel>
                <FormDescription>
                  Select which classes this teacher will handle
                </FormDescription>
              </div>
              <div className="space-y-2">
                {classOptions.map((option) => (
                  <FormField
                    key={option.id}
                    control={form.control}
                    name="assignedClasses"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={option.id}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(option.id)}
                              onCheckedChange={(checked) => {
                                const current = field.value || [];
                                if (checked) {
                                  field.onChange([...current, option.id]);
                                } else {
                                  field.onChange(
                                    current.filter((value) => value !== option.id)
                                  );
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            {option.label}
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

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEditMode ? "Update Teacher" : "Add Teacher"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
