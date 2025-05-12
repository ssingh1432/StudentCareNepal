import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertUserSchema } from '@shared/schema';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  Checkbox
} from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

// Extend the schema for the form
const teacherFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
  classes: z.array(z.string()).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface TeacherFormProps {
  initialData?: Omit<z.infer<typeof teacherFormSchema>, "password" | "confirmPassword" | "role"> & { id: number, classes: string[] };
  onSuccess: () => void;
  onCancel: () => void;
}

const TeacherForm: React.FC<TeacherFormProps> = ({
  initialData,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof teacherFormSchema>>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
      password: '',
      confirmPassword: '',
      role: 'teacher',
      classes: initialData?.classes || [],
    },
  });

  const onSubmit = async (values: z.infer<typeof teacherFormSchema>) => {
    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        email: values.email,
        role: 'teacher',
        classes: values.classes,
      };
      
      // Only include password if it's a new teacher or password was entered
      if (!initialData || values.password) {
        // @ts-ignore - We're adding password selectively
        payload.password = values.password;
      }
      
      const endpoint = initialData ? `/api/users/teachers/${initialData.id}` : '/api/users/teachers';
      const method = initialData ? 'PUT' : 'POST';
      
      const response = await apiRequest(method, endpoint, payload);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save teacher');
      }
      
      toast({
        title: `Teacher ${initialData ? 'updated' : 'created'} successfully`,
        description: `${values.name} has been ${initialData ? 'updated' : 'added'} to the system.`,
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error saving teacher:', error);
      toast({
        title: `Failed to ${initialData ? 'update' : 'create'} teacher`,
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
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
                <Input type="email" placeholder="teacher@school.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{initialData ? 'New Password (leave blank to keep current)' : 'Password'}</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder={initialData ? 'Enter new password' : 'Enter password'} 
                    {...field} 
                  />
                </FormControl>
                {initialData && (
                  <FormDescription>
                    Leave blank to keep current password
                  </FormDescription>
                )}
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
        </div>
        
        <FormField
          control={form.control}
          name="classes"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Assign Classes</FormLabel>
                <FormDescription>
                  Select the classes this teacher will manage
                </FormDescription>
              </div>
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="classes"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key="Nursery"
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes('Nursery')}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), 'Nursery'])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== 'Nursery'
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Nursery
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
                
                <FormField
                  control={form.control}
                  name="classes"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key="LKG"
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes('LKG')}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), 'LKG'])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== 'LKG'
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          LKG
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
                
                <FormField
                  control={form.control}
                  name="classes"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key="UKG"
                        className="flex flex-row items-start space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes('UKG')}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), 'UKG'])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== 'UKG'
                                    )
                                  )
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          UKG
                        </FormLabel>
                      </FormItem>
                    )
                  }}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : initialData ? 'Update Teacher' : 'Add Teacher'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TeacherForm;
