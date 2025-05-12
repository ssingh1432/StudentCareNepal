import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertProgressEntrySchema, ProgressEntry, Student } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface ProgressFormProps {
  initialData?: Partial<ProgressEntry>;
  studentId?: number;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEditMode?: boolean;
}

export function ProgressForm({
  initialData,
  studentId,
  onSuccess,
  onCancel,
  isEditMode = false,
}: ProgressFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(
    studentId || initialData?.studentId
  );

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: student } = useQuery<Student>({
    queryKey: [`/api/students/${selectedStudentId}`],
    enabled: !!selectedStudentId,
  });

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().slice(0, 10);

  const form = useForm({
    resolver: zodResolver(insertProgressEntrySchema),
    defaultValues: {
      studentId: initialData?.studentId || studentId,
      date: initialData?.date ? new Date(initialData.date).toISOString().slice(0, 10) : today,
      socialSkills: initialData?.socialSkills || "good",
      preLiteracy: initialData?.preLiteracy || "good",
      preNumeracy: initialData?.preNumeracy || "good",
      motorSkills: initialData?.motorSkills || "good",
      emotionalDevelopment: initialData?.emotionalDevelopment || "good",
      comments: initialData?.comments || "",
    },
  });

  // Update the form when studentId changes
  useEffect(() => {
    if (studentId && studentId !== form.getValues().studentId) {
      form.setValue("studentId", studentId);
      setSelectedStudentId(studentId);
    }
  }, [studentId, form]);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Format date to ISO string
      const formattedData = {
        ...data,
        date: new Date(data.date).toISOString(),
      };

      if (isEditMode && initialData?.id) {
        // Update existing progress entry
        await apiRequest("PATCH", `/api/progress/${initialData.id}`, formattedData);
        toast({
          title: "Progress updated",
          description: "The progress entry has been updated successfully",
        });
      } else {
        // Create new progress entry
        await apiRequest("POST", "/api/progress", formattedData);
        toast({
          title: "Progress recorded",
          description: "The progress entry has been recorded successfully",
        });
      }

      // Invalidate relevant queries
      if (selectedStudentId) {
        queryClient.invalidateQueries({ queryKey: [`/api/students/${selectedStudentId}/progress`] });
      }
      
      // Call success callback
      if (onSuccess) onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStudentChange = (studentId: string) => {
    const id = parseInt(studentId, 10);
    form.setValue("studentId", id);
    setSelectedStudentId(id);
  };

  const formatEnumValue = (value: string): string => {
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select
                    onValueChange={handleStudentChange}
                    defaultValue={field.value?.toString()}
                    disabled={!!studentId || isEditMode}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name} ({student.classType.toUpperCase()})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {student && (
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="text-sm font-medium mb-2">Student Details</h3>
                <div className="flex items-center mb-2">
                  {student.photoUrl ? (
                    <img
                      src={student.photoUrl}
                      alt={student.name}
                      className="h-10 w-10 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center mr-3">
                      <span className="text-purple-600 font-medium">
                        {student.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{student.name}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Badge variant={student.classType as any} className="text-xs">
                        {student.classType.toUpperCase()}
                      </Badge>
                      <Badge variant={student.learningAbility as any} className="text-xs">
                        {formatEnumValue(student.learningAbility)}
                      </Badge>
                    </div>
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
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
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
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
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
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
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
                      <SelectItem value="excellent">Excellent</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
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
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="needs_improvement">Needs Improvement</SelectItem>
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

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEditMode ? "Update Progress" : "Save Progress"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
