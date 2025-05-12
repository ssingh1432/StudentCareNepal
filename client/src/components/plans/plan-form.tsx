import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getSuggestions, createSuggestionPrompt } from "@/lib/deepseek";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, WandSparkles, Plus } from "lucide-react";
import { 
  Alert,
  AlertTitle,
  AlertDescription
} from "@/components/ui/alert";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  insertTeachingPlanSchema, 
  classOptions, 
  planTypeOptions,
  TeachingPlan
} from "@shared/schema";

// Create the form schema with validation
const formSchema = insertTeachingPlanSchema.extend({
  // Add client-side validation
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  activities: z.string().min(10, { message: "Activities must be at least 10 characters" }),
  goals: z.string().min(10, { message: "Goals must be at least 10 characters" }),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid start date",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Please enter a valid end date",
  }),
  type: z.enum(planTypeOptions),
  class: z.enum(classOptions),
  createdBy: z.number(),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: "End date must be after start date",
    path: ["endDate"],
  }
);

type FormValues = z.infer<typeof formSchema>;

interface PlanFormProps {
  plan?: TeachingPlan | null;
  onClose: () => void;
}

export function PlanForm({ plan, onClose }: PlanFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string | null>(null);

  // Set default values based on existing plan or new plan
  const defaultValues: Partial<FormValues> = plan
    ? {
        ...plan,
        // Convert dates to string format for the form
        startDate: new Date(plan.startDate).toISOString().split("T")[0],
        endDate: new Date(plan.endDate).toISOString().split("T")[0],
      }
    : {
        title: "",
        description: "",
        activities: "",
        goals: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0],
        type: "Weekly",
        class: "Nursery",
        createdBy: user?.id || 0,
      };

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  // Create or update plan mutation
  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Set the creator ID to the current user
      data.createdBy = user?.id || 0;

      // Create or update plan
      if (plan) {
        return apiRequest("PUT", `/api/plans/${plan.id}`, data);
      } else {
        return apiRequest("POST", "/api/plans", data);
      }
    },
    onSuccess: () => {
      toast({
        title: plan ? "Plan Updated" : "Plan Created",
        description: plan
          ? "The teaching plan has been updated successfully."
          : "The teaching plan has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: FormValues) => {
    mutation.mutate(data);
  };

  // Generate AI suggestions
  const handleGenerateSuggestions = async () => {
    setIsGeneratingSuggestions(true);
    try {
      const planType = form.getValues("type");
      const classType = form.getValues("class");
      const prompt = createSuggestionPrompt(planType, classType);
      
      const response = await getSuggestions(prompt);
      setSuggestions(response.response);
    } catch (error) {
      toast({
        title: "Failed to Generate Suggestions",
        description: error instanceof Error ? error.message : "An error occurred while generating suggestions.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  // Add AI suggestions to activities
  const handleAddSuggestions = () => {
    if (!suggestions) return;
    
    const currentActivities = form.getValues("activities");
    const updatedActivities = currentActivities 
      ? `${currentActivities}\n\n${suggestions}` 
      : suggestions;
    
    form.setValue("activities", updatedActivities);
    setSuggestions(null);
    
    toast({
      title: "Suggestions Added",
      description: "AI suggestions have been added to your activities.",
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Type</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {planTypeOptions.map((type) => (
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
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {classOptions.map((classType) => (
                      <SelectItem key={classType} value={classType}>
                        {classType}
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
          name="title"
          render={({ field }) => (
            <FormItem>
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
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter plan description" 
                  rows={3}
                  {...field} 
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
                  <Input type="date" {...field} />
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
                  <Input type="date" {...field} />
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
                <FormLabel>Activities</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSuggestions}
                  disabled={isGeneratingSuggestions}
                >
                  {isGeneratingSuggestions ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <WandSparkles className="mr-2 h-4 w-4" />
                      Get Activity Suggestions
                    </>
                  )}
                </Button>
              </div>
              <FormControl>
                <Textarea 
                  placeholder="List the planned activities" 
                  rows={4}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {suggestions && (
          <Card className="bg-purple-50 border-purple-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-purple-800">DeepSeek AI Suggestions</CardTitle>
              <CardDescription>Here are some suggested activities based on your plan:</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {suggestions}
              </div>
              <div className="flex justify-end mt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleAddSuggestions}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add these to my plan
                </Button>
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
                  placeholder="Describe the learning goals for this plan" 
                  rows={3}
                  {...field} 
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
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {plan ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>{plan ? "Update" : "Save"} Plan</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
