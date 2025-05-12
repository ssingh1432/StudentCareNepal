import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { InsertTeachingPlan, insertTeachingPlanSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { getAISuggestions } from "@/lib/deepseek";
import { AISuggestions } from "./ai-suggestions";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { CalendarIcon, Sparkles, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Extend the teaching plan schema for the form
const planFormSchema = insertTeachingPlanSchema.extend({
  startDate: z.date(),
  endDate: z.date().refine(
    (date) => date > new Date(), 
    { message: "End date must be in the future" }
  ),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

interface PlanFormProps {
  open: boolean;
  onClose: () => void;
  editingPlan?: { id: number } & Partial<InsertTeachingPlan>;
}

export function PlanForm({ open, onClose, editingPlan }: PlanFormProps) {
  const { toast } = useToast();
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Form initialization
  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      type: editingPlan?.type || "Weekly",
      class: editingPlan?.class || "Nursery",
      title: editingPlan?.title || "",
      description: editingPlan?.description || "",
      activities: editingPlan?.activities || "",
      goals: editingPlan?.goals || "",
      startDate: editingPlan?.startDate ? new Date(editingPlan.startDate) : new Date(),
      endDate: editingPlan?.endDate ? new Date(editingPlan.endDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to a week later
    },
  });
  
  // Update end date based on plan type when type changes
  useEffect(() => {
    const type = form.getValues("type");
    const startDate = form.getValues("startDate");
    let endDate = new Date(startDate);
    
    switch (type) {
      case "Weekly":
        endDate.setDate(startDate.getDate() + 7);
        break;
      case "Monthly":
        endDate.setMonth(startDate.getMonth() + 1);
        break;
      case "Annual":
        endDate.setFullYear(startDate.getFullYear() + 1);
        break;
    }
    
    if (!editingPlan) {
      form.setValue("endDate", endDate);
    }
  }, [form.watch("type"), form.watch("startDate"), editingPlan, form]);
  
  // Create/update plan mutation
  const mutation = useMutation({
    mutationFn: async (values: PlanFormValues) => {
      if (editingPlan?.id) {
        return await apiRequest("PUT", `/api/teaching-plans/${editingPlan.id}`, values);
      } else {
        return await apiRequest("POST", "/api/teaching-plans", values);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teaching-plans'] });
      toast({
        title: editingPlan ? "Plan Updated" : "Plan Created",
        description: `Teaching plan has been ${editingPlan ? "updated" : "created"} successfully.`,
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (values: PlanFormValues) => {
    mutation.mutate(values);
  };
  
  const generateSuggestions = async () => {
    setIsLoadingSuggestions(true);
    setShowSuggestions(true);
    
    try {
      const planType = form.getValues("type");
      const planClass = form.getValues("class");
      const prompt = `Generate 3-5 engaging ${planType.toLowerCase()} activities for ${planClass} students (age ${planClass === "Nursery" ? "3" : planClass === "LKG" ? "4" : "5"} years) that focus on social skills, pre-literacy, pre-numeracy, and motor skills development.`;
      
      const suggestions = await getAISuggestions(prompt);
      setAiSuggestions(suggestions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI suggestions. Please try again later.",
        variant: "destructive",
      });
      console.error("AI suggestion error:", error);
      setAiSuggestions("Unable to generate suggestions at this time. Please try again later.");
    } finally {
      setIsLoadingSuggestions(false);
    }
  };
  
  const appendSuggestions = (text: string) => {
    const currentActivities = form.getValues("activities");
    const updatedActivities = currentActivities 
      ? `${currentActivities}\n\n${text}` 
      : text;
    
    form.setValue("activities", updatedActivities);
    setShowSuggestions(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPlan ? "Edit Teaching Plan" : "Create New Teaching Plan"}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                        <SelectItem value="Weekly">Weekly</SelectItem>
                        <SelectItem value="Monthly">Monthly</SelectItem>
                        <SelectItem value="Annual">Annual</SelectItem>
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
                    <Input placeholder="Enter plan title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                          disabled={(date) =>
                            date < form.getValues("startDate")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter plan description" 
                      className="h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Provide a brief overview of what this teaching plan aims to achieve.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="activities"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activities</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="List the activities planned" 
                      className="h-32"
                      {...field} 
                    />
                  </FormControl>
                  <div className="flex justify-end mt-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={generateSuggestions}
                      disabled={isLoadingSuggestions}
                      className="bg-purple-600 text-white hover:bg-purple-700"
                    >
                      {isLoadingSuggestions ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="mr-2 h-4 w-4" />
                      )}
                      {isLoadingSuggestions ? "Generating..." : "Get Activity Suggestions"}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {showSuggestions && (
              <AISuggestions 
                suggestions={aiSuggestions} 
                isLoading={isLoadingSuggestions}
                onAccept={appendSuggestions}
                onClose={() => setShowSuggestions(false)}
              />
            )}
            
            <FormField
              control={form.control}
              name="goals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Learning Goals</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter learning goals" 
                      className="h-24"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    Outline the specific learning outcomes you aim to achieve with this plan.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 
                  (editingPlan ? "Updating..." : "Creating...") : 
                  (editingPlan ? "Update Plan" : "Create Plan")
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
