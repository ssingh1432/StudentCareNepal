import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CloudinaryUpload } from "@/components/ui/CloudinaryUpload";
import { useAuth } from "@/context/AuthContext";
import { classLevels, learningAbilities, writingSpeeds, insertStudentSchema } from "@shared/schema";

interface StudentFormProps {
  studentId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StudentForm({ studentId, onSuccess, onCancel }: StudentFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);

  // Extended schema with frontend validations
  const studentFormSchema = insertStudentSchema.extend({
    name: z.string().min(2, { message: "Name must be at least 2 characters" }),
    age: z.number().min(3, { message: "Age must be at least 3 years" }).max(5, { message: "Age must be at most 5 years" }),
    class: z.enum(classLevels as [string, ...string[]], { 
      errorMap: () => ({ message: "Please select a class" }),
    }),
    learningAbility: z.enum(learningAbilities as [string, ...string[]], {
      errorMap: () => ({ message: "Please select learning ability" }),
    }),
    writingSpeed: z.enum(writingSpeeds as [string, ...string[]], {
      errorMap: () => ({ message: "Please select writing speed" }),
    }),
    teacherId: z.number({
      required_error: "Please select a teacher",
    }),
  });

  // Query to fetch teachers for the dropdown
  const { data: teachers, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['/api/teachers'],
    enabled: isAdmin, // Only admin needs to select teachers
  });

  // Query to fetch student data if editing
  const { data: studentData, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['/api/students', studentId],
    enabled: !!studentId,
  });

  // Form hook
  const form = useForm<z.infer<typeof studentFormSchema>>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      age: 3,
      class: "Nursery",
      parentContact: "",
      learningAbility: "Average",
      writingSpeed: "N/A",
      notes: "",
      teacherId: 0,
    },
  });

  // Update form when student data is loaded
  useState(() => {
    if (studentData) {
      form.reset({
        name: studentData.name,
        age: studentData.age,
        class: studentData.class,
        parentContact: studentData.parentContact || "",
        learningAbility: studentData.learningAbility,
        writingSpeed: studentData.writingSpeed,
        notes: studentData.notes || "",
        teacherId: studentData.teacherId,
      });
      setPhotoUrl(studentData.photoUrl);
    }
  });

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof studentFormSchema>) => {
      const requestData = {
        ...data,
        photoUrl: photoUrl,
      };

      if (studentId) {
        return apiRequest("PUT", `/api/students/${studentId}`, requestData);
      } else {
        return apiRequest("POST", "/api/students", requestData);
      }
    },
    onSuccess: () => {
      toast({
        title: `Student ${studentId ? "updated" : "created"} successfully`,
        description: `The student has been ${studentId ? "updated" : "added"} to the system.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${studentId ? "update" : "create"} student: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof studentFormSchema>) => {
    mutation.mutate(data);
  };

  const isLoading = isLoadingStudent || isLoadingTeachers || mutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {classLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
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
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select learning ability" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {learningAbilities.map((ability) => (
                      <SelectItem key={ability} value={ability}>
                        {ability}
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
                <FormLabel>Writing Speed</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select writing speed" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {writingSpeeds.map((speed) => (
                      <SelectItem key={speed} value={speed}>
                        {speed}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    defaultValue={field.value.toString()}
                    value={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teachers?.map((teacher: any) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name} ({teacher.classes?.join(", ")})
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

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Add any additional notes"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="my-6">
          <FormLabel>Student Photo</FormLabel>
          <div className="mt-2 flex justify-center">
            <CloudinaryUpload 
              onUploadSuccess={setPhotoUrl} 
              currentImageUrl={photoUrl}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {studentId ? "Update" : "Add"} Student
          </Button>
        </div>
      </form>
    </Form>
  );
}
