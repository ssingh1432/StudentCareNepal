import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { classOptions } from '@shared/schema';

// Define the form schema
const teacherSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters").optional(),
  confirmPassword: z.string().optional(),
  assignedClasses: z.array(z.string()).min(1, "At least one class must be assigned"),
});

// Add additional validation for matching passwords
const teacherFormSchema = teacherSchema.refine(
  (data) => !data.password || !data.confirmPassword || data.password === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

export type TeacherFormValues = z.infer<typeof teacherFormSchema>;

interface TeacherFormProps {
  teacher?: Omit<TeacherFormValues, 'password' | 'confirmPassword'> & { id?: number };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TeacherForm: React.FC<TeacherFormProps> = ({ 
  teacher, 
  onSuccess, 
  onCancel 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const isEditMode = !!teacher?.id;
  
  // Initialize form with default values or existing teacher data
  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      name: teacher?.name || '',
      email: teacher?.email || '',
      password: '',
      confirmPassword: '',
      assignedClasses: teacher?.assignedClasses || [],
    }
  });

  // Create or update teacher
  const mutation = useMutation({
    mutationFn: async (values: TeacherFormValues) => {
      // Remove confirm password before sending to API
      const { confirmPassword, ...teacherData } = values;
      
      // Only include password if it's provided (for updates)
      const dataToSend = isEditMode && !teacherData.password
        ? { ...teacherData, password: undefined }
        : teacherData;
      
      // For the role field
      const finalData = {
        ...dataToSend,
        role: 'teacher'
      };
      
      const url = isEditMode 
        ? `/api/teachers/${teacher.id}` 
        : '/api/teachers';
      
      return await apiRequest(
        isEditMode ? 'PUT' : 'POST',
        url,
        finalData
      );
    },
    onSuccess: async () => {
      toast({
        title: `Teacher ${isEditMode ? 'updated' : 'created'} successfully`,
        description: `Teacher has been ${isEditMode ? 'updated' : 'added'} to the system.`,
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to ${isEditMode ? 'update' : 'create'} teacher`,
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (values: TeacherFormValues) => {
    mutation.mutate(values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Input 
                    type="email" 
                    placeholder="Enter email address" 
                    {...field} 
                    disabled={isEditMode} // Email cannot be changed once set
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{isEditMode ? 'New Password (optional)' : 'Password'}</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder={isEditMode ? "Leave blank to keep current" : "Enter password"} 
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
                <FormLabel>{isEditMode ? 'Confirm New Password' : 'Confirm Password'}</FormLabel>
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
        </div>
        
        <FormField
          control={form.control}
          name="assignedClasses"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel>Assign Classes</FormLabel>
                <FormDescription>
                  Select the classes this teacher will manage.
                </FormDescription>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {classOptions.map((className) => (
                  <FormField
                    key={className}
                    control={form.control}
                    name="assignedClasses"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={className}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(className)}
                              onCheckedChange={(checked) => {
                                const updatedValue = checked
                                  ? [...field.value, className]
                                  : field.value?.filter(
                                      (value) => value !== className
                                    );
                                field.onChange(updatedValue);
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {className}
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
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Update Teacher' : 'Add Teacher'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TeacherForm;
