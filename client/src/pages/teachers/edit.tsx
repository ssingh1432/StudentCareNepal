import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).optional().or(z.literal('')),
  confirmPassword: z.string().optional().or(z.literal('')),
  classes: z.array(z.string()).min(1, { message: "Please select at least one class" }),
}).refine((data) => !data.password || data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormData = z.infer<typeof formSchema>;

const classOptions = [
  { id: "Nursery", label: "Nursery" },
  { id: "LKG", label: "LKG" },
  { id: "UKG", label: "UKG" },
];

interface EditTeacherProps {
  id: number;
}

export default function EditTeacher({ id }: EditTeacherProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect non-admin users
  if (!isAdmin) {
    navigate("/");
    return null;
  }

  // Fetch teacher details
  const { data: teacher, isLoading } = useQuery({
    queryKey: [`/api/teachers/${id}`],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      classes: [],
    },
  });

  // Update form with teacher data once loaded
  useEffect(() => {
    if (teacher) {
      form.reset({
        name: teacher.name,
        email: teacher.email,
        password: "",
        confirmPassword: "",
        classes: teacher.classes || [],
      });
    }
  }, [teacher, form]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      // Extract data for API request (omit confirmPassword)
      const { confirmPassword, ...teacherData } = data;
      
      // If password is empty, remove it from the request
      if (!teacherData.password) {
        delete teacherData.password;
      }
      
      // Submit the form
      await apiRequest("PUT", `/api/teachers/${id}`, teacherData);
      
      // Invalidate teacher and teachers queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: [`/api/teachers/${id}`] });
      await queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      
      toast({
        title: "Success",
        description: "Teacher has been successfully updated",
      });
      
      // Navigate back to teachers list
      navigate("/teachers");
    } catch (error) {
      console.error("Error updating teacher:", error);
      toast({
        title: "Error",
        description: "Failed to update teacher. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="page-header">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-md mt-2" />
        </div>
        <Card>
          <CardHeader className="px-6 py-4 border-b border-gray-200">
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-24 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Edit Teacher</h2>
          <p className="mt-1 text-sm text-gray-500">
            Update information for {teacher?.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="px-6 py-4 border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-900">
            Teacher Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter teacher name" {...field} />
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
                        <Input type="email" placeholder="Enter email address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password (leave blank to keep current)</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Enter new password" {...field} />
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
                      <FormLabel>Confirm New Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Confirm new password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="classes"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel>Assign Classes</FormLabel>
                    </div>
                    <div className="space-y-2">
                      {classOptions.map((option) => (
                        <FormField
                          key={option.id}
                          control={form.control}
                          name="classes"
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
                                      return checked
                                        ? field.onChange([...field.value, option.id])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== option.id
                                            )
                                          );
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal">
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

              <div className="form-actions">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/teachers")}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Update Teacher"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
