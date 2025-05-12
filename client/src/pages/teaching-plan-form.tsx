import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { insertTeachingPlanSchema, TeachingPlan } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { 
  ArrowLeft, 
  Loader2, 
  Sparkles,
  Calendar, 
  BookText,
  ListChecks
} from "lucide-react";
import { getActivitySuggestions, getLearningGoalSuggestions } from "@/lib/deepseek";

// Extend the schema with custom validations
const teachingPlanFormSchema = insertTeachingPlanSchema.extend({
  startDate: z.string(),
  endDate: z.string(),
});

type TeachingPlanFormValues = z.infer<typeof teachingPlanFormSchema>;

interface TeachingPlanFormProps {
  mode?: "create" | "edit";
}

export default function TeachingPlanForm({ mode = "create" }: TeachingPlanFormProps) {
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const planId = params.id ? parseInt(params.id) : undefined;
  const isEditMode = mode === "edit" && planId !== undefined;

  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [isLoadingGoals, setIsLoadingGoals] = useState(false);

  // Fetch plan data if in edit mode
  const { data: plan, isLoading: isPlanLoading } = useQuery<TeachingPlan>({
    queryKey: [`/api/teaching-plans/${planId}`],
    enabled: isEditMode,
  });

  // Initialize form with default values
  const form = useForm<TeachingPlanFormValues>({
    resolver: zodResolver(teachingPlanFormSchema),
    defaultValues: {
      type: "Weekly",
      class: "Nursery",
      title: "",
      description: "",
      activities: "",
      goals: "",
      startDate: new Date().toISOString().split('T')[0], // Today's date
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // One week from today
      createdBy: user?.id || 0
    }
  });

  // Update form values when plan data is loaded
  useEffect(() => {
    if (isEditMode && plan) {
      form.reset({
        type: plan.type,
        class: plan.class,
        title: plan.title,
        description: plan.description,
        activities: plan.activities,
        goals: plan.goals,
        startDate: new Date(plan.startDate).toISOString().split('T')[0],
        endDate: new Date(plan.endDate).toISOString().split('T')[0],
        createdBy: plan.createdBy
      });
    }
  }, [isEditMode, plan, form]);

  // Create plan mutation
  const createPlanMutation = useMutation({
    mutationFn: async (values: TeachingPlanFormValues) => {
      return await apiRequest("POST", "/api/teaching-plans", values);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teaching plan created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teaching-plans"] });
      navigate("/teaching-plans");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update plan mutation
  const updatePlanMutation = useMutation({
    mutationFn: async (values: TeachingPlanFormValues) => {
      return await apiRequest("PUT", `/api/teaching-plans/${planId}`, values);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teaching plan updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/teaching-plans"] });
      queryClient.invalidateQueries({ queryKey: [`/api/teaching-plans/${planId}`] });
      navigate("/teaching-plans");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Form submission handler
  const onSubmit = (values: TeachingPlanFormValues) => {
    // Add the current user ID as creator if creating a new plan
    if (!isEditMode) {
      values.createdBy = user?.id || 0;
    }
    
    // Convert date strings to Date objects for the API
    const planData = {
      ...values,
      startDate: new Date(values.startDate),
      endDate: new Date(values.endDate),
    };
    
    if (isEditMode) {
      updatePlanMutation.mutate(planData);
    } else {
      createPlanMutation.mutate(planData);
    }
  };

  // Generate AI suggestions for activities
  const handleGenerateActivitySuggestions = async () => {
    try {
      setIsLoadingActivities(true);
      const planType = form.getValues("type");
      const planClass = form.getValues("class");
      const planTitle = form.getValues("title");
      
      const suggestions = await getActivitySuggestions({
        type: planType as any,
        class: planClass as any,
        topic: planTitle,
        count: 3
      });
      
      // Add suggestions to the current activities
      const currentActivities = form.getValues("activities");
      const updatedActivities = currentActivities 
        ? `${currentActivities}\n\n--- AI SUGGESTED ACTIVITIES ---\n${suggestions}` 
        : suggestions;
      
      form.setValue("activities", updatedActivities);
      
      toast({
        title: "AI Suggestions Generated",
        description: "Activities have been added to the form",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI suggestions. The service might be unavailable.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // Generate AI suggestions for learning goals
  const handleGenerateLearningGoalSuggestions = async () => {
    try {
      setIsLoadingGoals(true);
      const planType = form.getValues("type");
      const planClass = form.getValues("class");
      const planTitle = form.getValues("title");
      
      const suggestions = await getLearningGoalSuggestions({
        type: planType as any,
        class: planClass as any,
        topic: planTitle,
        count: 3
      });
      
      // Add suggestions to the current goals
      const currentGoals = form.getValues("goals");
      const updatedGoals = currentGoals 
        ? `${currentGoals}\n\n--- AI SUGGESTED GOALS ---\n${suggestions}` 
        : suggestions;
      
      form.setValue("goals", updatedGoals);
      
      toast({
        title: "AI Suggestions Generated",
        description: "Learning goals have been added to the form",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI suggestions. The service might be unavailable.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingGoals(false);
    }
  };

  // Loading state
  if (isEditMode && isPlanLoading) {
    return (
      <AppLayout title="Loading Plan...">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      </AppLayout>
    );
  }

  // Auto-adjust end date based on plan type when type changes
  const handlePlanTypeChange = (type: string) => {
    const startDateStr = form.getValues("startDate");
    const startDate = new Date(startDateStr);
    let endDate = new Date(startDate);
    
    switch (type) {
      case "Weekly":
        // End date is 7 days after start date
        endDate.setDate(startDate.getDate() + 7);
        break;
      case "Monthly":
        // End date is 1 month after start date
        endDate.setMonth(startDate.getMonth() + 1);
        break;
      case "Annual":
        // End date is 1 year after start date
        endDate.setFullYear(startDate.getFullYear() + 1);
        break;
    }
    
    form.setValue("endDate", endDate.toISOString().split('T')[0]);
  };

  return (
    <AppLayout title={isEditMode ? "Edit Teaching Plan" : "Create Teaching Plan"}>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <Button variant="ghost" size="sm" onClick={() => navigate("/teaching-plans")}>
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Teaching Plans
              </Button>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {isEditMode ? "Edit Teaching Plan" : "Create Teaching Plan"}
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <Card>
          <CardContent className="pt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Type</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            handlePlanTypeChange(value);
                          }}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select plan type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Annual">Annual</SelectItem>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                            <SelectItem value="Weekly">Weekly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Select the duration of your teaching plan
                        </FormDescription>
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
                          value={field.value}
                          onValueChange={field.onChange}
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
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plan Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter a descriptive title for your plan" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide a detailed description of your teaching plan" 
                          rows={3} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                              <Calendar className="h-4 w-4" />
                            </span>
                            <input
                              type="date"
                              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                // Update end date based on the new start date and current plan type
                                handlePlanTypeChange(form.getValues("type"));
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <div className="flex">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                              <Calendar className="h-4 w-4" />
                            </span>
                            <input
                              type="date"
                              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="activities"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel className="flex items-center">
                          <BookText className="h-4 w-4 mr-2" />
                          Activities
                        </FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateActivitySuggestions}
                          disabled={isLoadingActivities}
                        >
                          {isLoadingActivities ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                          )}
                          Get AI Suggestions
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="List the activities planned for students" 
                          rows={5} 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Include detailed descriptions of each activity and required materials
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="goals"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel className="flex items-center">
                          <ListChecks className="h-4 w-4 mr-2" />
                          Learning Goals
                        </FormLabel>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateLearningGoalSuggestions}
                          disabled={isLoadingGoals}
                        >
                          {isLoadingGoals ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4 mr-2 text-purple-500" />
                          )}
                          Get AI Suggestions
                        </Button>
                      </div>
                      <FormControl>
                        <Textarea 
                          placeholder="Define the learning goals and expected outcomes" 
                          rows={4} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate("/teaching-plans")}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createPlanMutation.isPending || updatePlanMutation.isPending}
                  >
                    {(createPlanMutation.isPending || updatePlanMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isEditMode ? "Update Plan" : "Save Plan"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
