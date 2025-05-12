import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CloudinaryUpload } from "@/components/ui/cloudinary-upload";
import { useToast } from "@/hooks/use-toast";
import { User, StudentFormData } from "@/types";
import { createStudent } from "@/lib/api";
import { insertStudentSchema } from "@shared/schema";

interface AddStudentProps {
  user: User;
}

export default function AddStudent({ user }: AddStudentProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isAdmin = user.role === "admin";

  // Create validation schema from Zod
  const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    age: z.coerce.number().int().min(3).max(5),
    class: z.enum(["Nursery", "LKG", "UKG"]),
    parentContact: z.string().optional(),
    learningAbility: z.enum(["Talented", "Average", "Slow Learner"]),
    writingSpeed: z.enum(["Speed Writing", "Slow Writing", "N/A"]).optional(),
    notes: z.string().optional(),
    photoUrl: z.string().optional(),
    teacherId: z.coerce.number().optional(),
  });

  // Get form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: 3,
      class: "Nursery",
      parentContact: "",
      learningAbility: "Average",
      writingSpeed: "N/A",
      notes: "",
      photoUrl: "",
      teacherId: isAdmin ? undefined : user.id,
    },
  });

  // Watch the class field to set appropriate writing speed options
  const watchClass = form.watch("class");

  // Fetch teachers for admin
  const { data: teachers } = useQuery<User[]>({
    queryKey: ["/api/teachers"],
    enabled: isAdmin,
  });

  // Create student mutation
  const createMutation = useMutation({
    mutationFn: createStudent,
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setLocation("/students");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create student: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Submit handler
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // If class is Nursery, set writing speed to N/A
    if (values.class === "Nursery") {
      values.writingSpeed = "N/A";
    }
    
    // Set teacher ID for non-admins
    if (!isAdmin) {
      values.teacherId = user.id;
    }
    
    createMutation.mutate(values as StudentFormData);
  }

  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Student</h1>
          <p className="mt-1 text-sm text-gray-500">Create a new pre-primary student record</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>
              Enter the student's basic information and class assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                          <Input type="number" min={3} max={5} {...field} />
                        </FormControl>
                        <FormDescription>
                          Must be between 3-5 years
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                            <SelectItem value="Nursery">Nursery (~3 years)</SelectItem>
                            <SelectItem value="LKG">LKG (~4 years)</SelectItem>
                            <SelectItem value="UKG">UKG (~5 years)</SelectItem>
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
                
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                  
                  {watchClass !== "Nursery" && (
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
                              <SelectItem value="Speed Writing">Speed Writing</SelectItem>
                              <SelectItem value="Slow Writing">Slow Writing</SelectItem>
                              <SelectItem value="N/A">Not Applicable</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                {isAdmin && (
                  <FormField
                    control={form.control}
                    name="teacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign Teacher</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">Unassigned</SelectItem>
                            {teachers?.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                {teacher.name}
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
                
                <FormField
                  control={form.control}
                  name="photoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <CloudinaryUpload
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setLocation("/students")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Saving..." : "Save Student"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
