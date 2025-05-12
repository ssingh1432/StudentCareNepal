import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TeachingPlan, teachingPlanSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getAISuggestions, parseActivities } from "@/lib/deepseek";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  PlusCircle
} from "lucide-react";
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

interface PlanFormProps {
  plan: TeachingPlan | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function PlanForm({ plan, onClose, onSuccess }: PlanFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [aiError, setAIError] = useState<string | null>(null);

  // Setup form validation schema
  const formSchema = teachingPlanSchema.omit({
    teacherId: true,
  });

  // Get form methods
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: plan
      ? {
          type: plan.type,
          class: plan.class,
          title: plan.title,
          description: plan.description,
          activities: plan.activities,
          goals: plan.goals,
          startDate: new Date(plan.startDate).toISOString().split('T')[0],
          endDate: new Date(plan.endDate).toISOString().split('T')[0],
        }
      : {
          type: "Weekly",
          class: "Nursery",
          title: "",
          description: "",
          activities: "",
          goals: "",
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
  });

  // Create or update plan mutation
  const planMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      // Ensure dates are ISO strings
      const planData = {
        ...data,
        teacherId: user?.id || 0,
      };
      
      if (plan) {
        // Update existing plan
        await apiRequest("PUT", `/api/protected/teaching-plans/${plan.id}`, planData);
      } else {
        // Create new plan
        await apiRequest("POST", "/api/protected/teaching-plans", planData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/teaching-plans"] });
      toast({
        title: plan ? "Plan updated" : "Plan created",
        description: plan
          ? "Teaching plan has been updated successfully"
          : "New teaching plan has been created successfully",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${plan ? "update" : "create"} teaching plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: z.infer<typeof formSchema>) => {
    planMutation.mutate(data);
  };

  // Generate AI suggestions
  const generateSuggestions = async () => {
    setIsGeneratingSuggestions(true);
    setAIError(null);
    
    try {
      const classLevel = form.getValues("class");
      const planType = form.getValues("type").toLowerCase();
      
      const prompt = `Suggest 5 ${planType} activities for ${classLevel} students in Nepal's ECED framework. Include materials, instructions, and learning objectives. These should focus on ${form.getValues("title") || "general development"}.`;
      
      const response = await getAISuggestions(prompt);
      setSuggestions(response.suggestions);
    } catch (error) {
      setAIError(error instanceof Error ? error.message : "Failed to generate suggestions");
      toast({
        title: "Error generating suggestions",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  // Add AI suggestions to activities
  const addSuggestionsToActivities = () => {
    if (!suggestions) return;
    
    const currentActivities = form.getValues("activities");
    const parsedSuggestions = parseActivities(suggestions)
      .map((activity, index) => `${index + 1}. ${activity}`)
      .join("\n\n");
    
    const newActivities = currentActivities 
      ? `${currentActivities}\n\n--- AI Suggestions ---\n\n${parsedSuggestions}`
      : parsedSuggestions;
    
    form.setValue("activities", newActivities);
    setSuggestions(null);
  };

  // Update end date based on plan type when type changes
  const handlePlanTypeChange = (value: string) => {
    form.setValue("type", value);
    
    const startDate = new Date(form.getValues("startDate"));
    let endDate = new Date(startDate);
    
    if (value === "Weekly") {
      endDate.setDate(startDate.getDate() + 7);
    } else if (value === "Monthly") {
      endDate.setMonth(startDate.getMonth() + 1);
    } else if (value === "Annual") {
      endDate.setFullYear(startDate.getFullYear() + 1);
    }
    
    form.setValue("endDate", endDate.toISOString().split('T')[0]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{plan ? "Edit Teaching Plan" : "Create New Teaching Plan"}</CardTitle>
        <CardDescription>
          {plan
            ? "Update details of your teaching plan"
            : "Create a new teaching plan with activities and goals"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Type</FormLabel>
                    <Select
                      onValueChange={handlePlanTypeChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Annual">Annual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose a timeframe for your teaching plan
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
                      onValueChange={field.onChange}
                      defaultValue={field.value}
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

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Title</FormLabel>
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
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe the purpose and focus of this teaching plan"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        {...field}
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
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="activities"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Activities</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="List the activities planned"
                        rows={6}
                      />
                    </FormControl>
                    <div className="flex justify-end mt-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={generateSuggestions}
                        disabled={isGeneratingSuggestions}
                        className="text-sm"
                      >
                        {isGeneratingSuggestions ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Get Activity Suggestions
                          </>
                        )}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {aiError && (
                <div className="md:col-span-2">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                      {aiError}
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {suggestions && (
                <div className="md:col-span-2 bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-medium text-purple-800 flex items-center">
                      <Sparkles className="h-4 w-4 mr-1" />
                      DeepSeek AI Suggestions
                    </h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSuggestions(null)}
                      className="text-purple-500 hover:text-purple-700 p-0 h-auto"
                    >
                      Dismiss
                    </Button>
                  </div>
                  <div className="text-sm text-gray-700 max-h-48 overflow-y-auto mb-3">
                    {suggestions.split('\n').map((line, i) => (
                      <p key={i} className={line.trim() === '' ? 'mb-2' : 'mb-1'}>
                        {line}
                      </p>
                    ))}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={addSuggestionsToActivities}
                    className="w-full"
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    Add these to my plan
                  </Button>
                </div>
              )}

              <FormField
                control={form.control}
                name="goals"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Learning Goals</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="List the learning goals for students"
                        rows={4}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={planMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={planMutation.isPending}
              >
                {planMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {plan ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{plan ? "Update Plan" : "Save Plan"}</>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
