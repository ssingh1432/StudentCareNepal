import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import PhotoUpload from './PhotoUpload';
import { Loader2 } from 'lucide-react';
import { classOptions, learningAbilityOptions, writingSpeedOptions } from '@shared/schema';

// Define form schema using zod
const studentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().int().min(3, "Age must be at least 3").max(5, "Age must be at most 5"),
  class: z.enum(classOptions),
  parentContact: z.string().optional(),
  learningAbility: z.enum(learningAbilityOptions),
  writingSpeed: z.enum(writingSpeedOptions).optional(),
  notes: z.string().optional(),
  teacherId: z.number().int().positive(),
  photoUrl: z.string().optional(),
  photoPublicId: z.string().optional()
});

export type StudentFormValues = z.infer<typeof studentSchema>;

interface StudentFormProps {
  student?: StudentFormValues;
  teachers: { id: number; name: string; assignedClasses: string[] }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

const StudentForm: React.FC<StudentFormProps> = ({ 
  student, 
  teachers, 
  onSuccess, 
  onCancel 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: student?.name || '',
      age: student?.age || 3,
      class: student?.class || 'Nursery',
      parentContact: student?.parentContact || '',
      learningAbility: student?.learningAbility || 'Average',
      writingSpeed: student?.writingSpeed || 'N/A',
      notes: student?.notes || '',
      teacherId: student?.teacherId || (teachers.length > 0 ? teachers[0].id : 0),
      photoUrl: student?.photoUrl || '',
      photoPublicId: student?.photoPublicId || ''
    }
  });

  const isEditMode = !!student;

  // Create or update student
  const mutation = useMutation({
    mutationFn: async (values: StudentFormValues) => {
      // Create form data for file upload
      const formData = new FormData();
      
      // Add the photo if selected
      if (photoFile) {
        formData.append('photo', photoFile);
      }
      
      // Add the rest of the form data as JSON
      formData.append('data', JSON.stringify(values));
      
      // Use the appropriate endpoint based on edit/create mode
      const url = isEditMode 
        ? `/api/students/${student.id}` 
        : '/api/students';
        
      const method = isEditMode ? 'PUT' : 'POST';
      
      // Use fetch directly for multipart form data
      const response = await fetch(url, {
        method,
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save student');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: `Student ${isEditMode ? 'updated' : 'created'} successfully`,
        description: `Student has been ${isEditMode ? 'updated' : 'added'} to the system.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to ${isEditMode ? 'update' : 'create'} student`,
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (values: StudentFormValues) => {
    mutation.mutate(values);
  };

  // Filter teachers based on selected class
  const selectedClass = form.watch('class');
  const filteredTeachers = teachers.filter(teacher => 
    teacher.assignedClasses.includes(selectedClass)
  );

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
                  <Input placeholder="Enter student name" {...field} />
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
                  <Input 
                    type="number" 
                    min={3} 
                    max={5} 
                    placeholder="3-5 years" 
                    {...field} 
                  />
                </FormControl>
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
                    {classOptions.map((option) => (
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
            name="parentContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Contact (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter parent phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
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
                      <SelectValue placeholder="Select learning ability" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {learningAbilityOptions.map((option) => (
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
            name="writingSpeed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Writing Speed {selectedClass === 'Nursery' && '(Optional)'}</FormLabel>
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
                    {writingSpeedOptions.map((option) => (
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
            name="teacherId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assign Teacher</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a teacher" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {filteredTeachers.length > 0 ? (
                      filteredTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name} ({selectedClass})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="0" disabled>
                        No teachers assigned to this class
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
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
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <FormLabel>Student Photo</FormLabel>
          <PhotoUpload
            existingImageUrl={student?.photoUrl}
            onFileSelected={setPhotoFile}
          />
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Update Student' : 'Add Student'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StudentForm;
