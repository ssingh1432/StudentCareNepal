import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertStudentSchema } from '@shared/schema';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PhotoUpload from '../shared/PhotoUpload';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';

// Extend insertStudentSchema for form validation
const studentFormSchema = insertStudentSchema.extend({
  teacherId: z.number().optional(),
});

// Define props
interface StudentFormProps {
  initialData?: z.infer<typeof studentFormSchema>;
  teachers?: { id: number; name: string }[];
  onSuccess: () => void;
  onCancel: () => void;
}

const StudentForm: React.FC<StudentFormProps> = ({
  initialData,
  teachers = [],
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof studentFormSchema>>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: initialData || {
      name: '',
      age: 3,
      class: 'Nursery',
      parentContact: '',
      learningAbility: 'Average',
      writingSpeed: 'N/A',
      notes: '',
      photoUrl: '',
      teacherId: isAdmin ? undefined : user?.id,
    },
  });

  const onSubmit = async (values: z.infer<typeof studentFormSchema>) => {
    setIsSubmitting(true);
    try {
      // If teacher role, automatically assign to self
      if (!isAdmin && !values.teacherId) {
        values.teacherId = user?.id;
      }
      
      const endpoint = initialData ? `/api/students/${initialData.id}` : '/api/students';
      const method = initialData ? 'PUT' : 'POST';
      
      const response = await apiRequest(method, endpoint, values);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save student');
      }
      
      toast({
        title: `Student ${initialData ? 'updated' : 'created'} successfully`,
        description: `${values.name} has been ${initialData ? 'updated' : 'added'} to the system.`,
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error saving student:', error);
      toast({
        title: `Failed to ${initialData ? 'update' : 'create'} student`,
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotoUploaded = (url: string) => {
    form.setValue('photoUrl', url);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter student's full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={3}
                        max={5}
                        placeholder="Age"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>3-5 years</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                        <SelectItem value="Nursery">Nursery</SelectItem>
                        <SelectItem value="LKG">LKG</SelectItem>
                        <SelectItem value="UKG">UKG</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="parentContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Contact (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Parent's phone number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
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
                          <SelectValue placeholder="Select speed" />
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
                        {teachers.map((teacher) => (
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
          </div>
          
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student Photo</FormLabel>
                  <FormControl>
                    <PhotoUpload
                      initialUrl={field.value}
                      onPhotoUploaded={handlePhotoUploaded}
                      className="mt-2"
                    />
                  </FormControl>
                  <FormDescription>
                    Upload a photo of the student (max 1MB, JPEG/PNG)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional notes about the student"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
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
            ) : initialData ? 'Update Student' : 'Add Student'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StudentForm;
