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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { progressRatings, insertProgressEntrySchema } from "@shared/schema";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ProgressFormProps {
  progressId?: number;
  studentId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProgressForm({ progressId, studentId, onSuccess, onCancel }: ProgressFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Extended schema with frontend validations
  const progressFormSchema = insertProgressEntrySchema.extend({
    date: z.date({
      required_error: "Please select a date",
    }),
    socialSkills: z.enum(progressRatings as [string, ...string[]], { 
      errorMap: () => ({ message: "Please select a rating" }),
    }),
    preLiteracy: z.enum(progressRatings as [string, ...string[]], { 
      errorMap: () => ({ message: "Please select a rating" }),
    }),
    preNumeracy: z.enum(progressRatings as [string, ...string[]], { 
      errorMap: () => ({ message: "Please select a rating" }),
    }),
    motorSkills: z.enum(progressRatings as [string, ...string[]], { 
      errorMap: () => ({ message: "Please select a rating" }),
    }),
    emotionalDevelopment: z.enum(progressRatings as [string, ...string[]], { 
      errorMap: () => ({ message: "Please select a rating" }),
    }),
  });

  // Query to fetch students for the dropdown
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/students/assignedToMe'],
    enabled: !studentId, // Only fetch if studentId is not provided
  });

  // Query to fetch progress data if editing
  const { data: progressData, isLoading: isLoadingProgress } = useQuery({
    queryKey: ['/api/progress', progressId],
    enabled: !!progressId,
  });

  // Query to fetch student data if studentId is provided
  const { data: studentData, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['/api/students', studentId],
    enabled: !!studentId,
  });

  // Form hook
  const form = useForm<z.infer<typeof progressFormSchema>>({
    resolver: zodResolver(progressFormSchema),
    defaultValues: {
      studentId: studentId || 0,
      date: new Date(),
      socialSkills: "Good",
      preLiteracy: "Good",
      preNumeracy: "Good",
      motorSkills: "Good",
      emotionalDevelopment: "Good",
      comments: "",
      createdBy: user?.id || 0,
    },
  });

  // Update form when progress data is loaded
  if (progressData && !form.formState.isDirty) {
    form.reset({
      studentId: progressData.studentId,
      date: new Date(progressData.date),
      socialSkills: progressData.socialSkills,
      preLiteracy: progressData.preLiteracy,
      preNumeracy: progressData.preNumeracy,
      motorSkills: progressData.motorSkills,
      emotionalDevelopment: progressData.emotionalDevelopment,
      comments: progressData.comments || "",
      createdBy: progressData.createdBy,
    });
  }

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof progressFormSchema>) => {
      if (progressId) {
        return apiRequest("PUT", `/api/progress/${progressId}`, data);
      } else {
        return apiRequest("POST", "/api/progress", data);
      }
    },
    onSuccess: () => {
      toast({
        title: `Progress ${progressId ? "updated" : "recorded"} successfully`,
        description: `The progress has been ${progressId ? "updated" : "recorded"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${progressId ? "update" : "record"} progress: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof progressFormSchema>) => {
    mutation.mutate(data);
  };

  const isLoading = isLoadingProgress || isLoadingStudents || isLoadingStudent || mutation.isPending;
  const studentName = studentData?.name || "student";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {!studentId && (
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                    value={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students?.map((student: any) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name} ({student.class})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="socialSkills"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Social Skills</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {progressRatings.map((rating) => (
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
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {progressRatings.map((rating) => (
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
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {progressRatings.map((rating) => (
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
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {progressRatings.map((rating) => (
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
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {progressRatings.map((rating) => (
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
                  placeholder="Add any additional comments"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {progressId ? "Update" : "Save"} Progress
          </Button>
        </div>
      </form>
    </Form>
  );
}
