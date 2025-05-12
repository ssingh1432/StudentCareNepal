import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Progress, 
  progressValidationSchema, 
  InsertProgress, 
  Student,
  progressRatingOptions
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface ProgressFormProps {
  progress?: Progress;
  student?: Student;
  onClose: () => void;
}

const ProgressForm = ({ progress, student, onClose }: ProgressFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  const form = useForm<InsertProgress>({
    resolver: zodResolver(progressValidationSchema),
    defaultValues: {
      studentId: student?.id || 0,
      date: new Date().toISOString(),
      socialSkills: "good",
      preLiteracy: "good",
      preNumeracy: "good",
      motorSkills: "good",
      emotionalDevelopment: "good",
      comments: "",
    },
  });
  
  // Fetch students if needed (for admin to select)
  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const response = await fetch("/api/students", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch students");
      }
      
      return response.json();
    },
    enabled: isAdmin && !student, // Only fetch if admin and no student provided
  });
  
  // Set form values when editing existing progress
  useEffect(() => {
    if (progress) {
      form.reset({
        studentId: progress.studentId,
        date: new Date(progress.date).toISOString(),
        socialSkills: progress.socialSkills,
        preLiteracy: progress.preLiteracy,
        preNumeracy: progress.preNumeracy,
        motorSkills: progress.motorSkills,
        emotionalDevelopment: progress.emotionalDevelopment,
        comments: progress.comments || "",
      });
    } else if (student) {
      form.setValue("studentId", student.id);
    }
  }, [progress, student, form]);
  
  // Create or update progress mutation
  const mutation = useMutation({
    mutationFn: async (data: InsertProgress) => {
      if (progress) {
        // Update existing progress
        await apiRequest("PUT", `/api/progress/${progress.id}`, data);
      } else {
        // Create new progress
        await apiRequest("POST", "/api/progress", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students", form.getValues("studentId"), "progress"] });
      toast({
        title: progress ? "Progress updated" : "Progress recorded",
        description: progress
          ? "Progress entry has been updated successfully."
          : "Progress has been recorded successfully.",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: progress ? "Failed to update progress" : "Failed to record progress",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: InsertProgress) => {
    mutation.mutate(data);
  };
  
  // Helper to format date to YYYY-MM-DD for input
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {isAdmin && !student && (
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
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
                      {students?.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name} ({student.class.toUpperCase()})
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
              <FormItem className="sm:col-span-2">
                <FormLabel>Date</FormLabel>
                <FormControl>
                  <input 
                    type="date" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formatDateForInput(field.value)}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      field.onChange(newDate.toISOString());
                    }}
                  />
                </FormControl>
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
                    {progressRatingOptions.map((rating) => (
                      <SelectItem key={rating} value={rating}>
                        {rating.charAt(0).toUpperCase() + rating.slice(1)}
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
                    {progressRatingOptions.map((rating) => (
                      <SelectItem key={rating} value={rating}>
                        {rating.charAt(0).toUpperCase() + rating.slice(1)}
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
                    {progressRatingOptions.map((rating) => (
                      <SelectItem key={rating} value={rating}>
                        {rating.charAt(0).toUpperCase() + rating.slice(1)}
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
                    {progressRatingOptions.map((rating) => (
                      <SelectItem key={rating} value={rating}>
                        {rating.charAt(0).toUpperCase() + rating.slice(1)}
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
                    {progressRatingOptions.map((rating) => (
                      <SelectItem key={rating} value={rating}>
                        {rating.charAt(0).toUpperCase() + rating.slice(1)}
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
            name="comments"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Comments (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Add any additional comments"
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {progress ? "Update Progress" : "Save Progress"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProgressForm;
