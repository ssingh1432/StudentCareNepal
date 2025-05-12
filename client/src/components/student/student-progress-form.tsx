import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Student, ProgressRecord, insertProgressRecordSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { transformImage } from "@/lib/cloudinary";

interface StudentProgressFormProps {
  progressRecord: ProgressRecord | null;
  onSaved: () => void;
  onCancel: () => void;
}

// Extend the schema
const extendedSchema = insertProgressRecordSchema.extend({
  date: z.date({
    required_error: "Date is required",
  }),
});

type ProgressFormValues = z.infer<typeof extendedSchema>;

export function StudentProgressForm({ progressRecord, onSaved, onCancel }: StudentProgressFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Query students
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const res = await fetch("/api/students");
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });
  
  // Get selected student details if we have a progress record
  const selectedStudent = progressRecord 
    ? students?.find((s: Student) => s.id === progressRecord.studentId) 
    : null;
  
  const form = useForm<ProgressFormValues>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      studentId: progressRecord?.studentId || 0,
      date: progressRecord?.date ? new Date(progressRecord.date) : new Date(),
      socialSkills: progressRecord?.socialSkills || "Good",
      preLiteracy: progressRecord?.preLiteracy || "Good",
      preNumeracy: progressRecord?.preNumeracy || "Good",
      motorSkills: progressRecord?.motorSkills || "Good",
      emotionalDevelopment: progressRecord?.emotionalDevelopment || "Good",
      comments: progressRecord?.comments || "",
      createdBy: user?.id || 0,
    },
  });
  
  // Create/update progress record mutation
  const mutation = useMutation({
    mutationFn: async (data: ProgressFormValues) => {
      // Format date to ISO string
      const formattedData = {
        ...data,
        date: data.date.toISOString(),
      };
      
      if (progressRecord) {
        // Update existing progress record
        const res = await apiRequest("PUT", `/api/progress/${progressRecord.id}`, formattedData);
        return res.json();
      } else {
        // Create new progress record
        const res = await apiRequest("POST", "/api/progress", formattedData);
        return res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: progressRecord ? "Progress updated" : "Progress recorded",
        description: progressRecord 
          ? "Progress record has been updated successfully." 
          : "New progress record has been created successfully.",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
      
      onSaved();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });
  
  // Submit handler
  const onSubmit = (data: ProgressFormValues) => {
    mutation.mutate(data);
  };
  
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">
        {progressRecord ? "Edit Progress Record" : "Record Student Progress"}
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {!progressRecord && (
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value.toString()} 
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      disabled={isLoadingStudents}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students?.map((student: Student) => (
                          <SelectItem key={student.id} value={student.id.toString()}>
                            {student.name} ({student.class})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {/* Display selected student info */}
          {progressRecord && selectedStudent && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12 mr-3">
                  {selectedStudent.photoUrl ? (
                    <img 
                      src={transformImage(selectedStudent.photoUrl, { width: 120, height: 120, crop: 'fill' })} 
                      alt={selectedStudent.name}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-purple-600 font-medium">
                        {selectedStudent.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-medium">{selectedStudent.name}</h3>
                  <p className="text-sm text-gray-500">{selectedStudent.class} | {selectedStudent.age} years</p>
                </div>
              </div>
            </div>
          )}
          
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
                    value={field.value.toISOString().split("T")[0]}
                    onChange={(e) => field.onChange(new Date(e.target.value))}
                  />
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
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rating" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Needs Improvement">Needs Improvement</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
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
                    {...field} 
                    placeholder="Add any additional comments or observations"
                    rows={3}
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
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {progressRecord ? "Update Progress" : "Save Progress"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
