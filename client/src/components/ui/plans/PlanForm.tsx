import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { generateAISuggestions } from "@/lib/deepseek";
import { insertTeachingPlanSchema, classLevels, planTypes } from "@shared/schema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface PlanFormProps {
  planId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PlanForm({ planId, onSuccess, onCancel }: PlanFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

  // Extended schema with frontend validations
  const planFormSchema = insertTeachingPlanSchema.extend({
    startDate: z.date({
      required_error: "Start date is required",
    }),
    endDate: z.date({
      required_error: "End date is required",
    }),
    title: z.string().min(3, { message: "Title must be at least 3 characters" }),
    description: z.string().min(10, { message: "Description must be at least 10 characters" }),
    activities: z.string().min(10, { message: "Activities must be at least 10 characters" }),
    goals: z.string().min(10, { message: "Goals must be at least 10 characters" }),
  });

  // Query to fetch plan data if editing
  const { data: planData, isLoading: isLoadingPlan } = useQuery({
    queryKey: ['/api/plans', planId],
    enabled: !!planId,
  });

  // Form hook
  const form = useForm<z.infer<typeof planFormSchema>>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      type: "Weekly",
      class: "Nursery",
      title: "",
      description: "",
      activities: "",
      goals: "",
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: user?.id || 0,
    },
  });

  // Update form when plan data is loaded
  if (planData && !form.formState.isDirty) {
    form.reset({
      type: planData.type,
      class: planData.class,
      title: planData.title,
      description: planData.description,
      activities: planData.activities,
      goals: planData.goals,
      startDate: new Date(planData.startDate),
      endDate: new Date(planData.endDate),
      createdBy: planData.createdBy,
    });
  }

  // Create/Update mutation
  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof planFormSchema>) => {
      if (planId) {
        return apiRequest("PUT", `/api/plans/${planId}`, data);
      } else {
        return apiRequest("POST", "/api/plans", data);
      }
    },
    onSuccess: () => {
      toast({
        title: `Plan ${planId ? "updated" : "created"} successfully`,
        description: `The teaching plan has been ${planId ? "updated" : "created"} successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/plans'] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to ${planId ? "update" : "create"} plan: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof planFormSchema>) => {
    mutation.mutate(data);
  };

  const handleGenerateSuggestions = async () => {
    const planType = form.getValues("type");
    const className = form.getValues("class");
    
    if (!planType || !className) {
      toast({
        title: "Missing information",
        description: "Please select both a plan type and class before generating suggestions.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingSuggestions(true);
    try {
      const prompt = `Suggest 5 age-appropriate ${planType.toLowerCase()} activities for ${className} class (ages ${className === "Nursery" ? "3" : className === "LKG" ? "4" : "5"} years) in Nepal, focusing on social skills, pre-literacy, pre-numeracy, motor skills, and emotional development.`;
      
      const suggestions = await generateAISuggestions(prompt, className, planType);
      setAiSuggestions(suggestions);
      
    } catch (error) {
      console.error("Error generating suggestions:", error);
      toast({
        title: "Error",
        description: "Failed to generate AI suggestions. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const addSuggestionsToActivities = () => {
    if (aiSuggestions) {
      const currentActivities = form.getValues("activities");
      const updatedActivities = currentActivities 
        ? `${currentActivities}\n\n--- AI Suggestions ---\n${aiSuggestions}`
        : `--- AI Suggestions ---\n${aiSuggestions}`;
      
      form.setValue("activities", updatedActivities, { 
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true
      });
      
      setAiSuggestions(null);
      
      toast({
        title: "Added to activities",
        description: "AI suggestions have been added to your activities.",
      });
    }
  };

  const isLoading = isLoadingPlan || mutation.isPending;

  return (
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
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {planTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
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
            name="class"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {classLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
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
            name="title"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Plan Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter plan title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
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
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
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
            name="description"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter plan description"
                    className="min-h-20"
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
                    placeholder="List the activities planned"
                    className="min-h-32"
                    {...field}
                  />
                </FormControl>
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleGenerateSuggestions}
                    disabled={isGeneratingSuggestions}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isGeneratingSuggestions ? (
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

          {aiSuggestions && (
            <div className="md:col-span-2">
              <Alert className="bg-purple-50">
                <AlertTitle className="text-purple-800 flex items-center">
                  <Sparkles className="h-4 w-4 mr-2" /> DeepSeek AI Suggestions
                </AlertTitle>
                <AlertDescription>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {aiSuggestions}
                  </div>
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2 text-purple-600 border-purple-600 hover:text-purple-800 hover:bg-purple-50"
                      onClick={addSuggestionsToActivities}
                    >
                      <span className="mr-1">+</span> Add these to my plan
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
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
                    placeholder="Enter learning goals"
                    className="min-h-20"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {planId ? "Update" : "Create"} Plan
          </Button>
        </div>
      </form>
    </Form>
  );
}
