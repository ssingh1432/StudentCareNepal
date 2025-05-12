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
  FormMessage 
} from '@/components/ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { progressRatingOptions } from '@shared/schema';

// Student type for dropdown selection
interface Student {
  id: number;
  name: string;
  class: string;
}

// Define the form schema
const progressSchema = z.object({
  studentId: z.number().int().positive("Please select a student"),
  date: z.string().min(1, "Date is required"),
  socialSkills: z.enum(progressRatingOptions),
  preLiteracy: z.enum(progressRatingOptions),
  preNumeracy: z.enum(progressRatingOptions),
  motorSkills: z.enum(progressRatingOptions),
  emotionalDevelopment: z.enum(progressRatingOptions),
  comments: z.string().optional()
});

export type ProgressFormValues = z.infer<typeof progressSchema>;

interface ProgressFormProps {
  progress?: ProgressFormValues & { id?: number };
  student?: Student; // Pre-selected student (optional)
  students: Student[]; // Available students
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ProgressForm: React.FC<ProgressFormProps> = ({ 
  progress, 
  student, 
  students, 
  onSuccess, 
  onCancel 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const today = new Date().toISOString().split('T')[0];
  
  // Initialize form with default values or existing progress data
  const form = useForm<ProgressFormValues>({
    resolver: zodResolver(progressSchema),
    defaultValues: {
      studentId: student?.id || progress?.studentId || (students.length > 0 ? students[0].id : 0),
      date: progress?.date ? new Date(progress.date).toISOString().split('T')[0] : today,
      socialSkills: progress?.socialSkills || 'Good',
      preLiteracy: progress?.preLiteracy || 'Good',
      preNumeracy: progress?.preNumeracy || 'Good',
      motorSkills: progress?.motorSkills || 'Good',
      emotionalDevelopment: progress?.emotionalDevelopment || 'Good',
      comments: progress?.comments || ''
    }
  });

  const isEditMode = !!progress?.id;

  // Create or update progress entry
  const mutation = useMutation({
    mutationFn: async (values: ProgressFormValues) => {
      const url = isEditMode 
        ? `/api/progress/${progress.id}` 
        : '/api/progress';
      
      return await apiRequest(
        isEditMode ? 'PUT' : 'POST',
        url,
        values
      );
    },
    onSuccess: async () => {
      toast({
        title: `Progress ${isEditMode ? 'updated' : 'recorded'} successfully`,
        description: `Student progress has been ${isEditMode ? 'updated' : 'recorded'}.`,
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to ${isEditMode ? 'update' : 'record'} progress`,
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (values: ProgressFormValues) => {
    mutation.mutate(values);
  };

  // Get student by ID
  const getStudentById = (id: number) => {
    return students.find(s => s.id === id);
  };

  // Current student selected in the form
  const selectedStudentId = form.watch('studentId');
  const selectedStudent = getStudentById(selectedStudentId);
  const studentClass = selectedStudent?.class || '';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Student</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value.toString()}
                  disabled={!!student} // Disable if student is pre-selected
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a student" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id.toString()}>
                        {s.name} ({s.class})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <Input type="date" max={today} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="socialSkills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Social Skills</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {progressRatingOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {progressRatingOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {progressRatingOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
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
                <FormLabel>Motor Skills {studentClass === 'Nursery' && '(Important)'}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {progressRatingOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {progressRatingOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="comments"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comments (Optional)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Add any additional comments about the student's progress" 
                  className="resize-none"
                  {...field} 
                />
              </FormControl>
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
            {isEditMode ? 'Update Progress' : 'Save Progress'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProgressForm;
