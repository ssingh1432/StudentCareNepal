import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeachingPlanSchema, TeachingPlan } from "@shared/schema";

import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Loader2, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PlanFormProps {
  initialData?: Partial<TeachingPlan>;
  onSuccess?: () => void;
  onCancel?: () => void;
  isEditMode?: boolean;
}

export function PlanForm({
  initialData,
  onSuccess,
  onCancel,
  isEditMode = false,
}: PlanFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string>("");

  const form = useForm({
    resolver: zodResolver(insertTeachingPlanSchema),
    defaultValues: {
      type: initialData?.type || "weekly",
      classType: initialData?.classType || "nursery",
      title: initialData?.title || "",
      description: initialData?.description || "",
      activities: initialData?.activities || "",
      goals: initialData?.goals || "",
      startDate: initialData?.startDate 
        ? new Date(initialData.startDate).toISOString().slice(0, 10) 
        : new Date().toISOString().slice(0, 10),
      endDate: initialData?.endDate 
        ? new Date(initialData.endDate).toISOString().slice(0, 10) 
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    },
  });

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Format dates
      const formattedData = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };

      if (isEditMode && initialData?.id) {
        // Update existing plan
        await apiRequest("PATCH", `/api/teaching-plans/${initialData.id}`, formattedData);
        toast({
          title: "Teaching plan updated",
          description: "The teaching plan has been updated successfully",
        });
      } else {
        // Create new plan
        await apiRequest("POST", "/api/teaching-plans", formattedData);
        toast({
          title: "Teaching plan created",
          description: "The teaching plan has been created successfully",
        });
      }

      // Invalidate teaching plans query
      queryClient.invalidateQueries({ queryKey: ["/api/teaching-plans"] });
      
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

  const generateAiSuggestions = async () => {
    setIsGeneratingSuggestions(true);
    setSuggestions("");
    
    try {
      const classType = form.getValues("classType").toUpperCase();
      const planType = form.getValues("type");
      const title = form.getValues("title");
      
      // Create prompt based on form data
      let prompt = `Suggest activities for a ${planType} teaching plan for ${classType} class`;
      
      if (title) {
        prompt += ` focused on "${title}"`;
      }
      
      const res = await apiRequest("POST", "/api/ai-suggestions", { prompt });
      const data = await res.json();
      
      setSuggestions(data.suggestion);
    } catch (error: any) {
      toast({
        title: "Error generating suggestions",
        description: error.message || "Failed to get AI suggestions",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  const applySuggestions = () => {
    if (!suggestions) return;
    
    const currentActivities = form.getValues("activities");
    const updatedActivities = currentActivities 
      ? `${currentActivities}\n\n${suggestions}` 
      : suggestions;
    
    form.setValue("activities", updatedActivities);
    setSuggestions("");
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
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
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="classType"
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
                      <SelectItem value="nursery">Nursery</SelectItem>
                      <SelectItem value="lkg">LKG</SelectItem>
                      <SelectItem value="ukg">UKG</SelectItem>
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
                      placeholder="Describe the teaching plan"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
                  <FormLabel>Activities</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="List the activities for this plan"
                      className="resize-none"
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <div className="mt-2 flex justify-end">
                    <Button
                      type="button"
                      onClick={generateAiSuggestions}
                      variant="outline"
                      size="sm"
                      disabled={isGeneratingSuggestions}
                    >
                      {isGeneratingSuggestions ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Get AI Suggestions
                        </>
                      )}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Learning Goals</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Define the learning goals for this plan"
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {suggestions && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-sm font-medium text-purple-800">DeepSeek AI Suggestions</h4>
                <Button 
                  onClick={applySuggestions} 
                  variant="ghost" 
                  size="sm"
                  className="text-purple-600 text-sm font-medium"
                >
                  <Sparkles className="mr-1 h-3 w-3" /> Add to activities
                </Button>
              </div>
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {suggestions}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : isEditMode ? "Update Plan" : "Save Plan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
