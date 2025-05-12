import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { User, insertUserSchema, InsertUser, classOptions } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { z } from "zod";

interface TeacherFormProps {
  teacher?: User;
  onClose: () => void;
}

// Extend the schema with validation for teacher form
const teacherFormSchema = insertUserSchema
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
    assignedClasses: z.array(z.string()),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

const TeacherForm = ({ teacher, onClose }: TeacherFormProps) => {
  const { toast } = useToast();
  
  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
      role: "teacher",
      assignedClasses: [],
    },
  });
  
  // Set form values when editing
  useEffect(() => {
    if (teacher) {
      form.reset({
        email: teacher.email,
        password: "", // Don't set password when editing
        confirmPassword: "",
        name: teacher.name,
        role: "teacher",
        assignedClasses: teacher.assignedClasses || [],
      });
    }
  }, [teacher, form]);
  
  // Create or update teacher mutation
  const mutation = useMutation({
    mutationFn: async (data: TeacherFormValues) => {
      const { confirmPassword, ...userData } = data;
      
      if (teacher) {
        // Update existing teacher
        await apiRequest("PUT", `/api/teachers/${teacher.id}`, userData);
      } else {
        // Create new teacher
        await apiRequest("POST", "/api/teachers", userData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({
        title: teacher ? "Teacher updated" : "Teacher created",
        description: teacher
          ? `${form.getValues("name")} has been updated successfully.`
          : `${form.getValues("name")} has been added successfully.`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: teacher ? "Failed to update teacher" : "Failed to create teacher",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: TeacherFormValues) => {
    mutation.mutate(data);
  };
  
  return (
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
                  <Input placeholder="Enter email address" type="email" {...field} />
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
                <FormLabel>{teacher ? "New Password (leave blank to keep current)" : "Password"}</FormLabel>
                <FormControl>
                  <Input placeholder="Enter password" type="password" {...field} />
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
                  <Input placeholder="Confirm password" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="assignedClasses"
            render={() => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Assign Classes</FormLabel>
                <div className="mt-2 space-y-2">
                  {classOptions.map((classOption) => (
                    <div key={classOption} className="relative flex items-start">
                      <FormField
                        control={form.control}
                        name="assignedClasses"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-3">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(classOption)}
                                onCheckedChange={(checked) => {
                                  const updatedValue = checked
                                    ? [...field.value, classOption]
                                    : field.value.filter((value) => value !== classOption);
                                  field.onChange(updatedValue);
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {classOption.toUpperCase()}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {teacher ? "Update Teacher" : "Add Teacher"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TeacherForm;
