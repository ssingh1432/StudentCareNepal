import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { TeachingPlan, PlanType, ClassLevel } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";

// Form validation schema
const teachingPlanSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  type: z.enum(["Annual", "Monthly", "Weekly"]),
  class: z.enum(["Nursery", "LKG", "UKG"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  activities: z.string().min(10, "Activities must be at least 10 characters"),
  goals: z.string().min(10, "Goals must be at least 10 characters"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export type TeachingPlanFormValues = z.infer<typeof teachingPlanSchema>;

interface PlanFormProps {
  plan?: TeachingPlan | null;
  viewOnly?: boolean;
  onClose: () => void;
}

export default function PlanForm({ plan, viewOnly = false, onClose }: PlanFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(true);
  
  // Form default values
  const defaultValues: TeachingPlanFormValues = {
    title: plan?.title || "",
    type: (plan?.type as "Annual" | "Monthly" | "Weekly") || "Weekly",
    class: (plan?.class as "Nursery" | "LKG" | "UKG") || "Nursery",
    description: plan?.description || "",
    activities: plan?.activities || "",
    goals: plan?.goals || "",
    startDate: plan?.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : "",
    endDate: plan?.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : "",
  };
  
  // Initialize form
  const form = useForm<TeachingPlanFormValues>({
    resolver: zodResolver(teachingPlanSchema),
    defaultValues,
  });
  
  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (values: TeachingPlanFormValues) => {
      if (!user) throw new Error("User not authenticated");
      
      const apiData = {
        ...values,
        createdBy: user.id,
      };
      
      const response = await apiRequest('POST', '/api/teaching-plans', apiData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teaching-plans'] });
      toast({
        title: "Plan created",
        description: "New teaching plan has been created successfully",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (values: TeachingPlanFormValues) => {
      if (!plan?.id) throw new Error("Plan ID is required for update");
      
      const response = await apiRequest('PUT', `/api/teaching-plans/${plan.id}`, values);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teaching-plans'] });
      toast({
        title: "Plan updated",
        description: "Teaching plan has been updated successfully",
      });
      handleClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Generate AI suggestions
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  
  const generateAISuggestions = async () => {
    try {
      setIsGeneratingSuggestions(true);
      const classLevel = form.watch("class");
      
      const response = await fetch(`/api/ai-suggestions?classLevel=${classLevel}`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate suggestions");
      }
      
      const data = await response.json();
      
      // Add AI suggestions to the existing text
      const currentActivities = form.watch("activities");
      form.setValue("activities", currentActivities ? `${currentActivities}\n\n${data.activities}` : data.activities);
      
      const currentGoals = form.watch("goals");
      form.setValue("goals", currentGoals ? `${currentGoals}\n\n${data.goals}` : data.goals);
      
      toast({
        title: "AI Suggestions Added",
        description: "AI-generated activities and goals have been added to the form.",
      });
    } catch (error) {
      console.error("Error generating AI suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };
  
  // Form submission handler
  const onSubmit = (values: TeachingPlanFormValues) => {
    if (plan?.id) {
      updatePlanMutation.mutate(values);
    } else {
      createPlanMutation.mutate(values);
    }
  };
  
  // Dialog close handler
  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for dialog animation
  };
  
  // Get form error message
  const getErrorMessage = (field: keyof TeachingPlanFormValues): string => {
    return form.formState.errors[field]?.message || "";
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {viewOnly 
              ? `View Teaching Plan: ${plan?.title}` 
              : plan?.id 
                ? "Edit Teaching Plan" 
                : "Create New Teaching Plan"
            }
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...form.register("title")}
                placeholder="e.g., Monthly Math Activities"
                disabled={viewOnly}
              />
              {getErrorMessage("title") && (
                <p className="text-sm text-red-500">{getErrorMessage("title")}</p>
              )}
            </div>
            
            {/* Type */}
            <div className="space-y-2">
              <Label htmlFor="type">Plan Type</Label>
              <Select
                disabled={viewOnly}
                value={form.watch("type")}
                onValueChange={(value) => form.setValue("type", value as "Annual" | "Monthly" | "Weekly")}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select plan type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual">Annual</SelectItem>
                  <SelectItem value="Monthly">Monthly</SelectItem>
                  <SelectItem value="Weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
              {getErrorMessage("type") && (
                <p className="text-sm text-red-500">{getErrorMessage("type")}</p>
              )}
            </div>
            
            {/* Class */}
            <div className="space-y-2">
              <Label htmlFor="class">Class</Label>
              <Select
                disabled={viewOnly}
                value={form.watch("class")}
                onValueChange={(value) => form.setValue("class", value as "Nursery" | "LKG" | "UKG")}
              >
                <SelectTrigger id="class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Nursery">Nursery</SelectItem>
                  <SelectItem value="LKG">LKG</SelectItem>
                  <SelectItem value="UKG">UKG</SelectItem>
                </SelectContent>
              </Select>
              {getErrorMessage("class") && (
                <p className="text-sm text-red-500">{getErrorMessage("class")}</p>
              )}
            </div>
            
            {/* Date Range */}
            <div className="space-y-2 md:col-span-1">
              <Label>Date Range</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Input
                    type="date"
                    placeholder="Start Date"
                    {...form.register("startDate")}
                    disabled={viewOnly}
                  />
                  {getErrorMessage("startDate") && (
                    <p className="text-xs text-red-500">{getErrorMessage("startDate")}</p>
                  )}
                </div>
                <div>
                  <Input
                    type="date"
                    placeholder="End Date"
                    {...form.register("endDate")}
                    disabled={viewOnly}
                  />
                  {getErrorMessage("endDate") && (
                    <p className="text-xs text-red-500">{getErrorMessage("endDate")}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={3}
              {...form.register("description")}
              placeholder="Provide a brief overview of this teaching plan"
              disabled={viewOnly}
            />
            {getErrorMessage("description") && (
              <p className="text-sm text-red-500">{getErrorMessage("description")}</p>
            )}
          </div>
          
          {/* Activities */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="activities">Activities</Label>
              {!viewOnly && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateAISuggestions}
                  disabled={isGeneratingSuggestions}
                >
                  {isGeneratingSuggestions && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Generate AI Suggestions
                </Button>
              )}
            </div>
            <Textarea
              id="activities"
              rows={5}
              {...form.register("activities")}
              placeholder="List the planned activities for students"
              disabled={viewOnly}
            />
            {getErrorMessage("activities") && (
              <p className="text-sm text-red-500">{getErrorMessage("activities")}</p>
            )}
          </div>
          
          {/* Goals */}
          <div className="space-y-2">
            <Label htmlFor="goals">Learning Goals</Label>
            <Textarea
              id="goals"
              rows={5}
              {...form.register("goals")}
              placeholder="Outline the learning objectives and goals"
              disabled={viewOnly}
            />
            {getErrorMessage("goals") && (
              <p className="text-sm text-red-500">{getErrorMessage("goals")}</p>
            )}
          </div>
          
          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
            >
              {viewOnly ? "Close" : "Cancel"}
            </Button>
            
            {!viewOnly && (
              <Button
                type="submit"
                disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
              >
                {(createPlanMutation.isPending || updatePlanMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {plan?.id ? "Update Plan" : "Create Plan"}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}