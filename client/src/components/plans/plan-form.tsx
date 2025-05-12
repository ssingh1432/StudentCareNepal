import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertTeachingPlanSchema, TeachingPlan } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { getAISuggestions, generatePrompt } from "@/lib/deepseek";
import { format } from "date-fns";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const formSchema = z.object({
  type: z.enum(["Annual", "Monthly", "Weekly"]),
  class: z.enum(["Nursery", "LKG", "UKG"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  activities: z.string().min(1, "Activities are required"),
  goals: z.string().min(1, "Goals are required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  createdById: z.number(),
});

type FormValues = z.infer<typeof formSchema>;

interface PlanFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: TeachingPlan;
  isEditing?: boolean;
}

export default function PlanForm({ onSuccess, onCancel, initialData, isEditing = false }: PlanFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData 
      ? {
          ...initialData,
          startDate: format(new Date(initialData.startDate), "yyyy-MM-dd"),
          endDate: format(new Date(initialData.endDate), "yyyy-MM-dd"),
        }
      : {
          type: "Weekly",
          class: "LKG",
          title: "",
          description: "",
          activities: "",
          goals: "",
          startDate: format(new Date(), "yyyy-MM-dd"),
          endDate: format(new Date(new Date().setDate(new Date().getDate() + 7)), "yyyy-MM-dd"),
          createdById: user?.id || 0,
        },
  });
  
  const selectedClass = form.watch("class");
  const selectedType = form.watch("type");
  
  const handleAISuggestions = async () => {
    try {
      setIsGeneratingSuggestions(true);
      
      const prompt = generatePrompt(selectedClass, selectedType);
      const suggestions = await getAISuggestions(prompt);
      setAiSuggestions(suggestions);
      
      toast({
        title: "AI Suggestions Generated",
        description: "Activity suggestions have been generated.",
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
  
  const applyAISuggestions = () => {
    if (aiSuggestions) {
      form.setValue("activities", aiSuggestions);
    }
  };
  
  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      
      if (isEditing && initialData) {
        // Update existing plan
        const response = await apiRequest(
          "PUT", 
          `/api/plans/${initialData.id}`, 
          values
        );
        
        toast({
          title: "Plan Updated",
          description: `Successfully updated plan: ${values.title}.`,
        });
      } else {
        // Create new plan
        const response = await apiRequest("POST", "/api/plans", values);
        
        toast({
          title: "Plan Created",
          description: `Successfully created plan: ${values.title}.`,
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? 'update' : 'create'} plan. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Teaching Plan" : "Create Teaching Plan"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <Input placeholder="Enter a title for this plan" {...field} />
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
                      placeholder="Describe the plan's purpose and objectives"
                      className="resize-none"
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
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <FormLabel>Activities</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAISuggestions}
                  disabled={isGeneratingSuggestions}
                  className="h-8"
                >
                  {isGeneratingSuggestions ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Get Activity Suggestions
                    </>
                  )}
                </Button>
              </div>
              
              <FormField
                control={form.control}
                name="activities"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea 
                        placeholder="List the activities planned for this period"
                        className="resize-none"
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            {aiSuggestions && (
              <Alert className="bg-purple-50 border-purple-200">
                <AlertTitle className="flex items-center">
                  <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
                  DeepSeek AI Suggestions
                </AlertTitle>
                <AlertDescription className="mt-2">
                  <div className="text-sm text-gray-700 max-h-60 overflow-y-auto p-2 bg-white border border-purple-100 rounded">
                    {aiSuggestions.split('\n\n').map((paragraph, i) => (
                      <p key={i} className="mb-2">{paragraph}</p>
                    ))}
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={applyAISuggestions}
                    className="mt-2"
                  >
                    Apply These Suggestions
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            
            <FormField
              control={form.control}
              name="goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Learning Goals</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List the learning goals for this plan"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="createdById"
              render={({ field }) => (
                <input type="hidden" {...field} />
              )}
            />
            
            <CardFooter className="flex justify-end space-x-2 px-0 pt-4">
              <Button variant="outline" onClick={onCancel} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting 
                  ? "Saving..." 
                  : (isEditing ? "Update Plan" : "Create Plan")
                }
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
