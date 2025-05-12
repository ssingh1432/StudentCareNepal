import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InsertUser, insertUserSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Extend the user schema for the form
const teacherFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
  assignedClasses: z.array(z.string()).refine((value) => value.length > 0, {
    message: "At least one class must be assigned to the teacher.",
  }),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
);

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface TeacherFormProps {
  open: boolean;
  onClose: () => void;
  editingTeacher?: { id: number } & Partial<InsertUser>;
}

export function TeacherForm({ open, onClose, editingTeacher }: TeacherFormProps) {
  const { toast } = useToast();
  
  // Form initialization
  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      email: editingTeacher?.email || "",
      password: "", // We don't show the existing password
      confirmPassword: "",
      name: editingTeacher?.name || "",
      role: "teacher",
      assignedClasses: editingTeacher?.assignedClasses || [],
    },
  });
  
  // Create/update teacher mutation
  const mutation = useMutation({
    mutationFn: async (values: TeacherFormValues) => {
      // Remove confirmPassword from the payload
      const { confirmPassword, ...teacherData } = values;
      
      if (editingTeacher?.id) {
        // If editing and password is empty, remove it from the request
        if (!teacherData.password) {
          delete teacherData.password;
        }
        return await apiRequest("PUT", `/api/teachers/${editingTeacher.id}`, teacherData);
      } else {
        return await apiRequest("POST", "/api/teachers", teacherData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      toast({
        title: editingTeacher ? "Teacher Updated" : "Teacher Added",
        description: `Teacher has been ${editingTeacher ? "updated" : "added"} successfully.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: TeacherFormValues) => {
    mutation.mutate(values);
  };
  
  const classOptions = [
    { id: "Nursery", label: "Nursery" },
    { id: "LKG", label: "LKG" },
    { id: "UKG", label: "UKG" },
  ];
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <FormLabel>{editingTeacher ? "New Password (leave blank to keep current)" : "Password"}</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder={editingTeacher ? "Enter new password (optional)" : "Enter password"} 
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
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input 
                      type="password" 
                      placeholder="Confirm password" 
                      {...field} 
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
                    <FormDescription>
                      Select the classes this teacher will be responsible for.
                    </FormDescription>
                  </div>
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
                                  return checked
                                    ? field.onChange([...field.value, option.id])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== option.id
                                        )
                                      )
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {option.label}
                            </FormLabel>
                          </FormItem>
                        )
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 
                  (editingTeacher ? "Updating..." : "Adding...") : 
                  (editingTeacher ? "Update Teacher" : "Add Teacher")
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
