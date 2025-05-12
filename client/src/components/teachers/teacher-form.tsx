import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  insertUserSchema, 
  classOptions,
  User
} from "@shared/schema";

// Create the form schema with validation
const formSchema = insertUserSchema.extend({
  // Add client-side validation
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }).optional(),
  confirmPassword: z.string().optional(),
  assignedClasses: z.array(z.string()).min(1, { message: "Please select at least one class" }),
}).refine(
  (data) => !data.password || data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

type FormValues = z.infer<typeof formSchema>;

interface TeacherFormProps {
  teacher?: User | null;
  onClose: () => void;
}

export function TeacherForm({ teacher, onClose }: TeacherFormProps) {
  const { toast } = useToast();

  // Set default values based on existing teacher or new teacher
  const defaultValues: Partial<FormValues> = teacher
    ? {
        ...teacher,
      }
    : {
        name: "",
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        role: "teacher",
        assignedClasses: ["Nursery"],
      };

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Create or update teacher mutation
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Remove confirmPassword as it's not part of the schema
      const { confirmPassword, ...teacherData } = data;
      
      // For existing teachers, if password is empty, remove it
      if (teacher && !teacherData.password) {
        delete teacherData.password;
      }

      // Create or update teacher
      if (teacher) {
        return apiRequest("PUT", `/api/users/${teacher.id}`, teacherData);
      } else {
        return apiRequest("POST", "/api/register", teacherData);
      }
    },
    onSuccess: () => {
      toast({
        title: teacher ? "Teacher Updated" : "Teacher Created",
        description: teacher
          ? "The teacher has been updated successfully."
          : "The teacher has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="Enter username" {...field} />
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
                  <Input 
                    type="password" 
                    placeholder={teacher ? "••••••••" : "Enter password"} 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {(form.watch("password") || !teacher) && (
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Confirm password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="assignedClasses"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Assign Classes</FormLabel>
                <FormDescription>
                  Select the classes this teacher will be responsible for
                </FormDescription>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {classOptions.map((cls) => (
                  <FormField
                    key={cls}
                    control={form.control}
                    name="assignedClasses"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={cls}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(cls)}
                              onCheckedChange={(checked) => {
                                const currentValue = [...(field.value || [])];
                                if (checked) {
                                  // Add the class if it's not already included
                                  if (!currentValue.includes(cls)) {
                                    field.onChange([...currentValue, cls]);
                                  }
                                } else {
                                  // Remove the class if it's included
                                  field.onChange(currentValue.filter((value) => value !== cls));
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {cls}
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

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {teacher ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{teacher ? "Update" : "Create"} Teacher</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
