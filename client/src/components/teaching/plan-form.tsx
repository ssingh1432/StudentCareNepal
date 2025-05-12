import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { TeachingPlan, insertTeachingPlanSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getTeachingPlanSuggestions, formatSuggestionPrompt } from "@/lib/deepseek";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlanFormProps {
  plan: TeachingPlan | null;
  onSaved: () => void;
  onCancel: () => void;
}

// Extend the schema with proper date handling
const extendedSchema = insertTeachingPlanSchema.extend({
  startDate: z.date({
    required_error: "Start date is required",
  }),
  endDate: z.date({
    required_error: "End date is required",
  }),
});

type PlanFormValues = z.infer<typeof extendedSchema>;

export function PlanForm({ plan, onSaved, onCancel }: PlanFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(extendedSchema),
    defaultValues: {
      type: plan?.type || "Weekly",
      class: plan?.class || "Nursery",
      title: plan?.title || "",
      description: plan?.description || "",
      activities: plan?.activities || "",
      goals: plan?.goals || "",
      startDate: plan?.startDate ? new Date(plan.startDate) : new Date(),
      endDate: plan?.endDate ? new Date(plan.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      createdBy: user?.id || 0,
    },
  });
  
  // Get AI suggestions for teaching plan activities
  const handleGetSuggestions = async () => {
    setIsLoadingSuggestions(true);
    
    try {
      const formValues = form.getValues();
      
      // Generate prompt based on form values
      const prompt = formatSuggestionPrompt({
        class: formValues.class as any,
        planType: formValues.type as any,
        count: 4,
      });
      
      const result = await getTeachingPlanSuggestions({ prompt });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      setAiSuggestions(result.activities);
    } catch (error) {
      toast({
        title: "Error getting suggestions",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  
  // Add AI suggestions to the activities field
  const addSuggestionsToActivities = () => {
    if (!aiSuggestions.length) return;
    
    const currentActivities = form.getValues("activities");
    const newActivities = currentActivities 
      ? `${currentActivities}\n\n${aiSuggestions.join("\n")}`
      : aiSuggestions.join("\n");
    
    form.setValue("activities", newActivities);
    setAiSuggestions([]);
  };
  
  // Create/update teaching plan mutation
  const mutation = useMutation({
    mutationFn: async (data: PlanFormValues) => {
      // Format dates to ISO strings
      const formattedData = {
        ...data,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
      };
      
      if (plan) {
        // Update existing plan
        const res = await apiRequest("PUT", `/api/teaching-plans/${plan.id}`, formattedData);
        return res.json();
      } else {
        // Create new plan
        const res = await apiRequest("POST", "/api/teaching-plans", formattedData);
        return res.json();
      }
    },
    onSuccess: () => {
      toast({
        title: plan ? "Plan updated" : "Plan created",
        description: plan 
          ? `${plan.title} has been updated successfully.` 
          : "New teaching plan has been created successfully.",
      });
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["/api/teaching-plans"] });
      
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
  const onSubmit = (data: PlanFormValues) => {
    mutation.mutate(data);
  };
  
  return (
    <div>
      <h2 className="text-xl font-bold mb-4">
        {plan ? `Edit Plan: ${plan.title}` : "Create Teaching Plan"}
      </h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Plan Type</FormLabel>
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select plan type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Annual">Annual</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
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
                  <FormControl>
                    <Select 
                      value={field.value} 
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nursery">Nursery (~3 years)</SelectItem>
                        <SelectItem value="LKG">LKG (~4 years)</SelectItem>
                        <SelectItem value="UKG">UKG (~5 years)</SelectItem>
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
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter plan title" />
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
                    {...field} 
                    placeholder="Enter plan description"
                    rows={3}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date</FormLabel>
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
            
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date</FormLabel>
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
          </div>
          
          <FormField
            control={form.control}
            name="activities"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Activities</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="List the activities for this plan"
                    rows={4}
                  />
                </FormControl>
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    className="bg-purple-600 hover:bg-purple-700"
                    onClick={handleGetSuggestions}
                    disabled={isLoadingSuggestions}
                  >
                    {isLoadingSuggestions ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Get Activity Suggestions
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium text-purple-800">DeepSeek AI Suggestions</h4>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                    AI Generated
                  </Badge>
                </div>
                <div className="text-sm text-gray-700">
                  <p className="mb-2">Here are some suggested activities:</p>
                  <ol className="list-decimal list-inside space-y-1 pl-2">
                    {aiSuggestions.map((suggestion, index) => (
                      <li key={index} className="text-gray-700">{suggestion}</li>
                    ))}
                  </ol>
                  
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="ghost"
                      className="text-purple-600 hover:text-purple-800 text-sm"
                      onClick={addSuggestionsToActivities}
                    >
                      <Sparkles className="mr-1 h-3 w-3" />
                      Add these to my plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          <FormField
            control={form.control}
            name="goals"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Learning Goals</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Describe the learning goals for this plan"
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
              {plan ? "Update Plan" : "Save Plan"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
