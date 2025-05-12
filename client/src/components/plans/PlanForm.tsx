import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { 
  Plan, 
  planValidationSchema, 
  InsertPlan, 
  classOptions,
  planTypeOptions
} from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
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
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import AISuggestions from "./AISuggestions";

interface PlanFormProps {
  plan?: Plan;
  onClose: () => void;
}

const PlanForm = ({ plan, onClose }: PlanFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  
  const form = useForm<InsertPlan>({
    resolver: zodResolver(planValidationSchema),
    defaultValues: {
      type: "weekly",
      class: "nursery",
      title: "",
      description: "",
      activities: "",
      goals: "",
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Default to 1 week from now
      teacherId: user?.id || 0,
    },
  });
  
  // Set form values when editing an existing plan
  useEffect(() => {
    if (plan) {
      form.reset({
        type: plan.type,
        class: plan.class,
        title: plan.title,
        description: plan.description,
        activities: plan.activities,
        goals: plan.goals,
        startDate: new Date(plan.startDate).toISOString(),
        endDate: new Date(plan.endDate).toISOString(),
        teacherId: plan.teacherId,
      });
    }
  }, [plan, form]);
  
  // Create or update plan mutation
  const mutation = useMutation({
    mutationFn: async (data: InsertPlan) => {
      if (plan) {
        // Update existing plan
        await apiRequest("PUT", `/api/plans/${plan.id}`, data);
      } else {
        // Create new plan
        await apiRequest("POST", "/api/plans", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({
        title: plan ? "Plan updated" : "Plan created",
        description: plan
          ? `${form.getValues("title")} has been updated successfully.`
          : `${form.getValues("title")} has been created successfully.`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: plan ? "Failed to update plan" : "Failed to create plan",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const onSubmit = (data: InsertPlan) => {
    // Ensure teacherId is set to the current user if not specified
    if (!data.teacherId && user) {
      data.teacherId = user.id;
    }
    
    mutation.mutate(data);
  };
  
  // Helper to format date to YYYY-MM-DD for input
  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };
  
  // Handle AI suggestion addition
  const handleAddSuggestions = (suggestions: string) => {
    const currentActivities = form.getValues("activities");
    
    if (currentActivities) {
      form.setValue("activities", `${currentActivities}\n\n${suggestions}`);
    } else {
      form.setValue("activities", suggestions);
    }
    
    setShowAISuggestions(false);
    
    toast({
      title: "Suggestions added",
      description: "AI-generated suggestions have been added to your activities.",
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
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {planTypeOptions.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
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
                    {classOptions.map((classOption) => (
                      <SelectItem key={classOption} value={classOption}>
                        {classOption.toUpperCase()}
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
              <FormItem className="sm:col-span-2">
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
              <FormItem className="sm:col-span-2">
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter plan description"
                    className="resize-none"
                    rows={3}
                    {...field}
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
                    value={formatDateForInput(field.value)}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      field.onChange(newDate.toISOString());
                    }}
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
                    value={formatDateForInput(field.value)}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      field.onChange(newDate.toISOString());
                    }}
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
              <FormItem className="sm:col-span-2">
                <FormLabel>Activities</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="List the activities planned"
                    className="resize-none"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <div className="mt-2 flex justify-end">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowAISuggestions(true)}
                    className="text-purple-600 border-purple-600 hover:bg-purple-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    Get Activity Suggestions
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {showAISuggestions && (
            <div className="sm:col-span-2">
              <AISuggestions 
                planType={form.getValues("type")}
                classLevel={form.getValues("class")}
                onAddSuggestions={handleAddSuggestions}
                onCancel={() => setShowAISuggestions(false)}
              />
            </div>
          )}
          
          <FormField
            control={form.control}
            name="goals"
            render={({ field }) => (
              <FormItem className="sm:col-span-2">
                <FormLabel>Learning Goals</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter learning goals"
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {plan ? "Update Plan" : "Save Plan"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PlanForm;
