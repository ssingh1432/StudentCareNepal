import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

// Extended schema with password confirmation
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string(),
  assignedClasses: z.array(z.string()),
  role: z.string().default("teacher"),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

interface TeacherFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Omit<FormValues, "password" | "confirmPassword"> & { id?: number };
  isEditing?: boolean;
}

export default function TeacherForm({ onSuccess, onCancel, initialData, isEditing = false }: TeacherFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      password: "",
      confirmPassword: "",
      assignedClasses: initialData?.assignedClasses || [],
      role: "teacher",
    },
  });
  
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Remove confirm password field before sending to the server
      const { confirmPassword, ...dataToSend } = values;
      
      // If editing and password is empty, remove it from the request
      if (isEditing && !dataToSend.password) {
        const { password, ...dataWithoutPassword } = dataToSend;
        
        const response = await apiRequest(
          "PUT", 
          `/api/teachers/${initialData?.id}`, 
          dataWithoutPassword
        );
        
        toast({
          title: "Teacher Updated",
          description: `Successfully updated ${values.name}'s information.`,
        });
      } else if (isEditing) {
        // Editing with password update
        const response = await apiRequest(
          "PUT", 
          `/api/teachers/${initialData?.id}`, 
          dataToSend
        );
        
        toast({
          title: "Teacher Updated",
          description: `Successfully updated ${values.name}'s information.`,
        });
      } else {
        // Creating new teacher
        const response = await apiRequest("POST", "/api/teachers", dataToSend);
        
        toast({
          title: "Teacher Added",
          description: `Successfully added ${values.name} as a teacher.`,
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error saving teacher:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'add'} teacher. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Teacher" : "Add New Teacher"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter teacher's name" {...field} />
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
                      disabled={isEditing} // Can't change email if editing
                    />
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
                  <FormLabel>{isEditing ? "New Password (leave blank to keep current)" : "Password"}</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder={isEditing ? "Enter new password (optional)" : "Enter password"} 
                      {...field} 
                      required={!isEditing}
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
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Confirm password" 
                      {...field}
                      required={!isEditing || !!form.watch("password")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="assignedClasses"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Assign Classes</FormLabel>
                  </div>
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="assignedClasses"
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes("Nursery")}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValue, "Nursery"]);
                                  } else {
                                    field.onChange(currentValue.filter(val => val !== "Nursery"));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">Nursery</FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                    
                    <FormField
                      control={form.control}
                      name="assignedClasses"
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes("LKG")}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValue, "LKG"]);
                                  } else {
                                    field.onChange(currentValue.filter(val => val !== "LKG"));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">LKG</FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                    
                    <FormField
                      control={form.control}
                      name="assignedClasses"
                      render={({ field }) => {
                        return (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes("UKG")}
                                onCheckedChange={(checked) => {
                                  const currentValue = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentValue, "UKG"]);
                                  } else {
                                    field.onChange(currentValue.filter(val => val !== "UKG"));
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">UKG</FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <CardFooter className="flex justify-end space-x-2 px-0 pt-4">
              <Button variant="outline" onClick={onCancel} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? "Saving..." 
                  : (isEditing ? "Update Teacher" : "Add Teacher")
                }
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
