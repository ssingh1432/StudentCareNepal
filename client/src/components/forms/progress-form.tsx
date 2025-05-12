import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Progress, Student, ProgressRating } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

// Form validation schema
const progressSchema = z.object({
  studentId: z.number().int().positive("Student is required"),
  date: z.string().min(1, "Date is required"),
  socialSkills: z.enum(["Excellent", "Good", "Needs Improvement"]),
  preLiteracy: z.enum(["Excellent", "Good", "Needs Improvement"]),
  preNumeracy: z.enum(["Excellent", "Good", "Needs Improvement"]),
  motorSkills: z.enum(["Excellent", "Good", "Needs Improvement"]),
  emotionalDevelopment: z.enum(["Excellent", "Good", "Needs Improvement"]),
  comments: z.string().optional(),
});

export type ProgressFormValues = z.infer<typeof progressSchema>;

interface ProgressFormProps {
  progress?: Progress | null;
  student?: Student | null;
  students?: Student[] | null;
  onClose: () => void;
}

export default function ProgressForm({ progress, student, students = [], onClose }: ProgressFormProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(
    student?.id || progress?.studentId
  );

  // Rating options
  const ratingOptions = [
    { label: "Excellent", value: "Excellent" },
    { label: "Good", value: "Good" },
    { label: "Needs Improvement", value: "Needs Improvement" },
  ];

  // Form default values
  const defaultValues: ProgressFormValues = {
    studentId: student?.id || progress?.studentId || 0,
    date: progress?.date 
      ? new Date(progress.date).toISOString().split('T')[0] 
      : new Date().toISOString().split('T')[0],
    socialSkills: progress?.socialSkills as "Excellent" | "Good" | "Needs Improvement" || "Good",
    preLiteracy: progress?.preLiteracy as "Excellent" | "Good" | "Needs Improvement" || "Good",
    preNumeracy: progress?.preNumeracy as "Excellent" | "Good" | "Needs Improvement" || "Good",
    motorSkills: progress?.motorSkills as "Excellent" | "Good" | "Needs Improvement" || "Good",
    emotionalDevelopment: progress?.emotionalDevelopment as "Excellent" | "Good" | "Needs Improvement" || "Good",
    comments: progress?.comments || "",
  };

  // Initialize form
  const form = useForm<ProgressFormValues>({
    resolver: zodResolver(progressSchema),
    defaultValues,
  });

  // Create progress entry mutation
  const createProgressMutation = useMutation({
    mutationFn: async (values: ProgressFormValues) => {
      const response = await apiRequest('POST', '/api/progress', values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress', selectedStudentId?.toString()] });
      toast({
        title: "Progress recorded",
        description: "Student progress has been recorded successfully",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to record progress: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Update progress entry mutation
  const updateProgressMutation = useMutation({
    mutationFn: async (values: ProgressFormValues) => {
      if (!progress?.id) throw new Error("Progress ID is required for update");
      
      const response = await apiRequest('PUT', `/api/progress/${progress.id}`, values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress', selectedStudentId?.toString()] });
      toast({
        title: "Progress updated",
        description: "Student progress has been updated successfully",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update progress: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Form submission handler
  const onSubmit = (values: ProgressFormValues) => {
    if (progress?.id) {
      updateProgressMutation.mutate(values);
    } else {
      createProgressMutation.mutate(values);
    }
  };

  // Handle student selection change
  const handleStudentChange = (studentId: string) => {
    const parsedId = parseInt(studentId);
    setSelectedStudentId(parsedId);
    form.setValue("studentId", parsedId);
  };

  // Dialog close handler
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for dialog animation
  };

  // Get form error message
  const getErrorMessage = (field: keyof ProgressFormValues): string => {
    return form.formState.errors[field]?.message || "";
  };

  // Get selected student
  const getSelectedStudent = () => {
    return students?.find(s => s.id === selectedStudentId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {progress?.id ? "Edit Progress Entry" : "Record Student Progress"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {/* Student Selection */}
          <div className="space-y-2">
            <Label htmlFor="studentId">Student</Label>
            <Select
              disabled={!!student || !!progress}
              value={form.watch("studentId")?.toString() || ""}
              onValueChange={handleStudentChange}
            >
              <SelectTrigger id="studentId">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students?.map(s => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name} ({s.class})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getErrorMessage("studentId") && (
              <p className="text-sm text-red-500">{getErrorMessage("studentId")}</p>
            )}
          </div>
          
          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              {...form.register("date")}
            />
            {getErrorMessage("date") && (
              <p className="text-sm text-red-500">{getErrorMessage("date")}</p>
            )}
          </div>
          
          {/* Social Skills */}
          <div className="space-y-2">
            <Label htmlFor="socialSkills">Social Skills</Label>
            <Select
              value={form.watch("socialSkills")}
              onValueChange={(value) => form.setValue("socialSkills", value as "Excellent" | "Good" | "Needs Improvement")}
            >
              <SelectTrigger id="socialSkills">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getErrorMessage("socialSkills") && (
              <p className="text-sm text-red-500">{getErrorMessage("socialSkills")}</p>
            )}
          </div>
          
          {/* Pre-Literacy */}
          <div className="space-y-2">
            <Label htmlFor="preLiteracy">Pre-Literacy</Label>
            <Select
              value={form.watch("preLiteracy")}
              onValueChange={(value) => form.setValue("preLiteracy", value as "Excellent" | "Good" | "Needs Improvement")}
            >
              <SelectTrigger id="preLiteracy">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getErrorMessage("preLiteracy") && (
              <p className="text-sm text-red-500">{getErrorMessage("preLiteracy")}</p>
            )}
          </div>
          
          {/* Pre-Numeracy */}
          <div className="space-y-2">
            <Label htmlFor="preNumeracy">Pre-Numeracy</Label>
            <Select
              value={form.watch("preNumeracy")}
              onValueChange={(value) => form.setValue("preNumeracy", value as "Excellent" | "Good" | "Needs Improvement")}
            >
              <SelectTrigger id="preNumeracy">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getErrorMessage("preNumeracy") && (
              <p className="text-sm text-red-500">{getErrorMessage("preNumeracy")}</p>
            )}
          </div>
          
          {/* Motor Skills */}
          <div className="space-y-2">
            <Label htmlFor="motorSkills">Motor Skills</Label>
            <Select
              value={form.watch("motorSkills")}
              onValueChange={(value) => form.setValue("motorSkills", value as "Excellent" | "Good" | "Needs Improvement")}
            >
              <SelectTrigger id="motorSkills">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getErrorMessage("motorSkills") && (
              <p className="text-sm text-red-500">{getErrorMessage("motorSkills")}</p>
            )}
          </div>
          
          {/* Emotional Development */}
          <div className="space-y-2">
            <Label htmlFor="emotionalDevelopment">Emotional Development</Label>
            <Select
              value={form.watch("emotionalDevelopment")}
              onValueChange={(value) => form.setValue("emotionalDevelopment", value as "Excellent" | "Good" | "Needs Improvement")}
            >
              <SelectTrigger id="emotionalDevelopment">
                <SelectValue placeholder="Select rating" />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getErrorMessage("emotionalDevelopment") && (
              <p className="text-sm text-red-500">{getErrorMessage("emotionalDevelopment")}</p>
            )}
          </div>
          
          {/* Comments */}
          <div className="space-y-2">
            <Label htmlFor="comments">Comments</Label>
            <Textarea
              id="comments"
              rows={3}
              {...form.register("comments")}
              placeholder="Additional observations or comments"
            />
            {getErrorMessage("comments") && (
              <p className="text-sm text-red-500">{getErrorMessage("comments")}</p>
            )}
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createProgressMutation.isPending || updateProgressMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createProgressMutation.isPending || updateProgressMutation.isPending}
            >
              {(createProgressMutation.isPending || updateProgressMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {progress?.id ? "Update Progress" : "Record Progress"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}