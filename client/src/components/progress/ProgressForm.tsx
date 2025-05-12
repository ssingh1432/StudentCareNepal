import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertProgressEntrySchema } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { DEFAULT_AVATAR_URL } from '@/lib/cloudinary';

// Extend insertProgressEntrySchema for form validation
const progressFormSchema = insertProgressEntrySchema.extend({
  createdBy: z.number().optional(),
});

interface ProgressFormProps {
  student: {
    id: number;
    name: string;
    class: string;
    photoUrl?: string;
  };
  initialData?: z.infer<typeof progressFormSchema>;
  onSuccess: () => void;
  onCancel: () => void;
}

const ProgressForm: React.FC<ProgressFormProps> = ({
  student,
  initialData,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<z.infer<typeof progressFormSchema>>({
    resolver: zodResolver(progressFormSchema),
    defaultValues: initialData || {
      studentId: student.id,
      date: new Date().toISOString().split('T')[0],
      socialSkills: 'Good',
      preLiteracy: 'Good',
      preNumeracy: 'Good',
      motorSkills: 'Good',
      emotionalDevelopment: 'Good',
      comments: '',
      createdBy: user?.id,
    },
  });

  const onSubmit = async (values: z.infer<typeof progressFormSchema>) => {
    setIsSubmitting(true);
    try {
      // Add current user ID
      values.createdBy = user?.id;
      
      const endpoint = initialData ? `/api/progress/${initialData.id}` : '/api/progress';
      const method = initialData ? 'PUT' : 'POST';
      
      const response = await apiRequest(method, endpoint, values);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save progress entry');
      }
      
      toast({
        title: `Progress entry ${initialData ? 'updated' : 'created'} successfully`,
        description: `Progress for ${student.name} has been ${initialData ? 'updated' : 'recorded'}.`,
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error saving progress entry:', error);
      toast({
        title: `Failed to ${initialData ? 'update' : 'create'} progress entry`,
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* Student info */}
      <div className="flex items-center mb-6 p-4 bg-purple-50 rounded-lg">
        <Avatar className="h-12 w-12 mr-4">
          <AvatarImage src={student.photoUrl || DEFAULT_AVATAR_URL} alt={student.name} />
          <AvatarFallback className="bg-purple-100 text-purple-600">
            {getInitials(student.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold">{student.name}</h3>
          <p className="text-sm text-gray-500">Class: {student.class}</p>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <input
                    type="date"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="socialSkills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Social Skills</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="preLiteracy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pre-Literacy</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="preNumeracy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pre-Numeracy</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="motorSkills"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motor Skills</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="emotionalDevelopment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Emotional Development</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                      <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="comments"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Comments (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional comments or observations"
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
              ) : initialData ? 'Update Progress' : 'Save Progress'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ProgressForm;
