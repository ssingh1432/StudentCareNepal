import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { CloudinaryUpload } from "./cloudinary-upload";
import { Loader2 } from "lucide-react";
import { 
  insertStudentSchema, 
  classOptions, 
  learningAbilityOptions, 
  writingSpeedOptions,
  Student
} from "@shared/schema";

// Create the form schema with validation
const formSchema = insertStudentSchema.extend({
  // Add client-side validation
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  age: z.number().min(3, { message: "Age must be at least 3" }).max(5, { message: "Age must be at most 5" }),
  class: z.enum(classOptions, { message: "Please select a valid class" }),
  parentContact: z.string().optional(),
  learningAbility: z.enum(learningAbilityOptions, { message: "Please select a learning ability" }),
  writingSpeed: z.enum(writingSpeedOptions, { message: "Please select a writing speed" }).optional(),
  notes: z.string().optional(),
  photoUrl: z.string().optional(),
  photoPublicId: z.string().optional(),
  teacherId: z.number()
});

type FormValues = z.infer<typeof formSchema>;

interface StudentFormProps {
  student?: Student | null;
  onClose: () => void;
}

export function StudentForm({ student, onClose }: StudentFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(student?.photoUrl || null);
  const [uploadedPublicId, setUploadedPublicId] = useState<string | null>(student?.photoPublicId || null);

  // Set default values based on existing student or new student
  const defaultValues: Partial<FormValues> = student
    ? {
        ...student,
      }
    : {
        name: "",
        age: 3,
        class: "Nursery",
        parentContact: "",
        learningAbility: "Average",
        writingSpeed: "N/A",
        notes: "",
        photoUrl: "",
        photoPublicId: "",
        teacherId: user?.role === "admin" ? 0 : user?.id || 0
      };

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Get teachers if admin
  const { data: teachers } = useQuery({
    queryKey: ["/api/teachers"],
    enabled: user?.role === "admin",
  });

  // Create or update student mutation
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Add the photo information if available
      if (uploadedImageUrl && uploadedPublicId) {
        data.photoUrl = uploadedImageUrl;
        data.photoPublicId = uploadedPublicId;
      }

      // If user is a teacher, set the teacherId to the current user
      if (user?.role === "teacher") {
        data.teacherId = user.id;
      }

      // Create or update student
      if (student) {
        return apiRequest("PUT", `/api/students/${student.id}`, data);
      } else {
        return apiRequest("POST", "/api/students", data);
      }
    },
    onSuccess: () => {
      toast({
        title: student ? "Student Updated" : "Student Created",
        description: student
          ? "The student has been updated successfully."
          : "The student has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
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

  // Handle image upload success
  const handleUploadSuccess = (url: string, publicId: string) => {
    setUploadedImageUrl(url);
    setUploadedPublicId(publicId);
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
                    placeholder="3"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormDescription>Age should be between 3-5 years</FormDescription>
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
                    {classOptions.map((classType) => (
                      <SelectItem key={classType} value={classType}>
                        {classType}
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
                    {learningAbilityOptions.map((ability) => (
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
                <FormLabel>Writing Speed {form.watch("class") === "Nursery" && "(Optional for Nursery)"}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={form.watch("class") === "Nursery"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select writing speed" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {writingSpeedOptions.map((speed) => (
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

          {user?.role === "admin" && (
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
                      {teachers?.map((teacher: any) => (
                        <SelectItem 
                          key={teacher.id} 
                          value={teacher.id.toString()}
                          disabled={!teacher.assignedClasses.includes(form.watch("class"))}
                        >
                          {teacher.name} ({teacher.assignedClasses.join(", ")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Only teachers assigned to this class can be selected
                  </FormDescription>
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
                  placeholder="Any additional notes about the student" 
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Photo (Optional)</FormLabel>
          <div className="mt-1 flex items-center space-x-6">
            {uploadedImageUrl ? (
              <img
                src={uploadedImageUrl}
                alt="Student"
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : student?.photoUrl ? (
              <img
                src={student.photoUrl}
                alt="Student"
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 text-xl font-medium">
                  {form.watch("name")?.charAt(0)?.toUpperCase() || "S"}
                </span>
              </div>
            )}
            <CloudinaryUpload onSuccess={handleUploadSuccess} />
          </div>
        </div>

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
                {student ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{student ? "Update" : "Create"} Student</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
