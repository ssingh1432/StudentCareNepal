import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InsertStudent, insertStudentSchema } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { CloudinaryUpload } from "@/components/common/cloudinary-upload";

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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Extend the student schema for the form
const studentFormSchema = insertStudentSchema.extend({
  photoFile: z.any().optional(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

interface StudentFormProps {
  open: boolean;
  onClose: () => void;
  editingStudent?: { id: number } & Partial<InsertStudent>;
}

export function StudentForm({ open, onClose, editingStudent }: StudentFormProps) {
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(editingStudent?.photoUrl || null);

  // Fetch teachers for assigning students (admin only)
  const { data: teachers } = useQuery({
    queryKey: ['/api/teachers'],
    enabled: isAdmin && open,
  });

  // Form initialization
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: editingStudent?.name || "",
      age: editingStudent?.age || 3,
      class: editingStudent?.class || "Nursery",
      parentContact: editingStudent?.parentContact || "",
      learningAbility: editingStudent?.learningAbility || "Average",
      writingSpeed: editingStudent?.writingSpeed || "N/A",
      notes: editingStudent?.notes || "",
      teacherId: editingStudent?.teacherId || user?.id,
      photoUrl: editingStudent?.photoUrl || "",
    },
  });

  // Create/update student mutation
  const mutation = useMutation({
    mutationFn: async (values: StudentFormValues) => {
      const formData = new FormData();
      
      // Remove the file from values and send it separately
      const { photoFile, ...studentData } = values;
      
      // Add student data as JSON
      formData.append('data', JSON.stringify(studentData));
      
      // Add photo if available
      if (photoFile) {
        formData.append('photo', photoFile);
      }
      
      let res;
      if (editingStudent?.id) {
        res = await fetch(`/api/students/${editingStudent.id}`, {
          method: 'PUT',
          body: formData,
          credentials: 'include',
        });
      } else {
        res = await fetch('/api/students', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });
      }
      
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || res.statusText);
      }
      
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: editingStudent ? "Student Updated" : "Student Added",
        description: `Student has been ${editingStudent ? "updated" : "added"} successfully.`,
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

  const onSubmit = (values: StudentFormValues) => {
    // Add the file to the values
    values.photoFile = photoFile;
    mutation.mutate(values);
  };

  const handlePhotoChange = (file: File | null) => {
    setPhotoFile(file);
    
    // Create preview URL
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
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
                    <Input placeholder="Enter student name" {...field} />
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
                        placeholder="3-5 years" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
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
                    <Input placeholder="Enter parent phone number" {...field} />
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
                          <SelectValue placeholder="Select writing speed" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Speed Writing">Speed Writing</SelectItem>
                        <SelectItem value="Slow Writing">Slow Writing</SelectItem>
                        <SelectItem value="N/A">Not Applicable</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Optional for Nursery
                    </FormDescription>
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
                    <Textarea placeholder="Add any additional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="photoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Photo</FormLabel>
                  <div className="mt-1 flex items-center">
                    {photoPreview ? (
                      <div className="relative">
                        <img 
                          src={photoPreview} 
                          alt="Student preview" 
                          className="h-24 w-24 rounded-full object-cover border-2 border-white shadow"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white hover:bg-red-600 p-0"
                          type="button"
                          onClick={() => {
                            setPhotoPreview(null);
                            setPhotoFile(null);
                            field.onChange('');
                          }}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <div className="h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center">
                        <span className="text-3xl text-gray-300">👤</span>
                      </div>
                    )}
                    <CloudinaryUpload 
                      onFileSelect={handlePhotoChange} 
                      maxSize={1048576} // 1MB
                      accept="image/jpeg,image/png"
                    />
                  </div>
                  <FormDescription>
                    Upload a photo (max 1MB, JPEG/PNG)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {isAdmin && (
              <FormField
                control={form.control}
                name="teacherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Teacher</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString() || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select teacher" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {teachers?.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id.toString()}>
                            {teacher.name} ({teacher.assignedClasses?.join(', ')})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
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
                  (editingStudent ? "Updating..." : "Adding...") : 
                  (editingStudent ? "Update Student" : "Add Student")
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
