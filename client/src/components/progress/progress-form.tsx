import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Form, 
  FormControl, 
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
import { Loader2 } from "lucide-react";
import { 
  insertProgressEntrySchema, 
  progressRatingOptions,
  Student,
  ProgressEntry
} from "@shared/schema";

// Create the form schema with validation
const formSchema = insertProgressEntrySchema.extend({
  // Add client-side validation 
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid date",
  }),
  socialSkills: z.enum(progressRatingOptions, { 
    message: "Please select a rating" 
  }),
  preLiteracy: z.enum(progressRatingOptions, { 
    message: "Please select a rating" 
  }),
  preNumeracy: z.enum(progressRatingOptions, { 
    message: "Please select a rating" 
  }),
  motorSkills: z.enum(progressRatingOptions, { 
    message: "Please select a rating" 
  }),
  emotionalDevelopment: z.enum(progressRatingOptions, { 
    message: "Please select a rating" 
  }),
  comments: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface ProgressFormProps {
  progress?: ProgressEntry | null;
  student?: Student;
  students: Student[];
  onClose: () => void;
}

export function ProgressForm({ progress, student, students, onClose }: ProgressFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Set default values based on existing progress or new progress
  const defaultValues: Partial<FormValues> = progress
    ? {
        ...progress,
        date: new Date(progress.date).toISOString().split("T")[0],
      }
    : {
        studentId: student?.id || 0,
        date: new Date().toISOString().split("T")[0],
        socialSkills: "Good",
        preLiteracy: "Good",
        preNumeracy: "Good",
        motorSkills: "Good",
        emotionalDevelopment: "Good",
        comments: "",
        createdBy: user?.id || 0,
      };

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Create or update progress mutation
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Set the creator ID to the current user
      data.createdBy = user?.id || 0;

      // Create or update progress
      if (progress) {
        return apiRequest("PUT", `/api/progress/${progress.id}`, data);
      } else {
        return apiRequest("POST", "/api/progress", data);
      }
    },
    onSuccess: () => {
      toast({
        title: progress ? "Progress Updated" : "Progress Recorded",
        description: progress
          ? "The progress entry has been updated successfully."
          : "The progress has been recorded successfully.",
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="studentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(parseInt(value))}
                defaultValue={field.value?.toString()}
                disabled={!!student}
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
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                    {progressRatingOptions.map((rating) => (
                      <SelectItem key={rating} value={rating}>
                        {rating}
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
                    {progressRatingOptions.map((rating) => (
                      <SelectItem key={rating} value={rating}>
                        {rating}
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
                    {progressRatingOptions.map((rating) => (
                      <SelectItem key={rating} value={rating}>
                        {rating}
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
                <FormLabel>Motor Skills</FormLabel>
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
                    {progressRatingOptions.map((rating) => (
                      <SelectItem key={rating} value={rating}>
                        {rating}
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
                    {progressRatingOptions.map((rating) => (
                      <SelectItem key={rating} value={rating}>
                        {rating}
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
                  rows={3}
                  {...field} 
                />
              </FormControl>
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
                {progress ? "Updating..." : "Saving..."}
              </>
            ) : (
              <>{progress ? "Update" : "Save"} Progress</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
