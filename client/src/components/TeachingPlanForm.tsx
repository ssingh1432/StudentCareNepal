import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Sparkles } from 'lucide-react';
import { classOptions, teachingPlanTypeOptions } from '@shared/schema';
import { activityTypes, createSuggestionPrompt, getTeachingPlanSuggestions, cacheSuggestions, getSuggestionsFromCache } from '@/lib/deepseek';
import { useAuth } from '@/hooks/use-auth';

// Define form schema
const teachingPlanSchema = z.object({
  type: z.enum(teachingPlanTypeOptions),
  class: z.enum(classOptions),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  activities: z.string().min(1, "Activities are required"),
  goals: z.string().min(1, "Goals are required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export type TeachingPlanFormValues = z.infer<typeof teachingPlanSchema>;

interface TeachingPlanFormProps {
  plan?: TeachingPlanFormValues & { id?: number };
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TeachingPlanForm: React.FC<TeachingPlanFormProps> = ({ 
  plan, 
  onSuccess, 
  onCancel 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [suggestions, setSuggestions] = useState<string>('');
  const [suggestionsLoading, setSuggestionsLoading] = useState<boolean>(false);
  const [activityType, setActivityType] = useState<string>(activityTypes[0]);
  
  const today = new Date().toISOString().split('T')[0];
  
  // Initialize form with default values or existing plan data
  const form = useForm<TeachingPlanFormValues>({
    resolver: zodResolver(teachingPlanSchema),
    defaultValues: {
      type: plan?.type || 'Weekly',
      class: plan?.class || (user?.assignedClasses && user.assignedClasses.length > 0 ? user.assignedClasses[0] : 'Nursery'),
      title: plan?.title || '',
      description: plan?.description || '',
      activities: plan?.activities || '',
      goals: plan?.goals || '',
      startDate: plan?.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : today,
      endDate: plan?.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : today,
    }
  });

  const isEditMode = !!plan?.id;
  
  // Update endDate based on startDate and plan type
  const updateEndDate = (startDate: string, planType: string) => {
    if (!startDate) return;
    
    const start = new Date(startDate);
    let end = new Date(start);
    
    switch (planType) {
      case 'Annual':
        end.setFullYear(start.getFullYear() + 1);
        end.setDate(end.getDate() - 1);
        break;
      case 'Monthly':
        end.setMonth(start.getMonth() + 1);
        end.setDate(end.getDate() - 1);
        break;
      case 'Weekly':
        end.setDate(start.getDate() + 6); // 7 days including start day
        break;
    }
    
    form.setValue('endDate', end.toISOString().split('T')[0]);
  };

  // Create or update teaching plan
  const mutation = useMutation({
    mutationFn: async (values: TeachingPlanFormValues) => {
      const url = isEditMode 
        ? `/api/teaching-plans/${plan.id}` 
        : '/api/teaching-plans';
      
      return await apiRequest(
        isEditMode ? 'PUT' : 'POST',
        url,
        values
      );
    },
    onSuccess: async () => {
      toast({
        title: `Teaching plan ${isEditMode ? 'updated' : 'created'} successfully`,
        description: `Teaching plan has been ${isEditMode ? 'updated' : 'created'}.`,
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/teaching-plans'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: `Failed to ${isEditMode ? 'update' : 'create'} teaching plan`,
        description: error.message,
        variant: 'destructive',
      });
    }
  });

  const onSubmit = (values: TeachingPlanFormValues) => {
    mutation.mutate(values);
  };
  
  // Generate suggestions using DeepSeek AI
  const generateSuggestions = async () => {
    const selectedClass = form.getValues('class');
    
    if (!selectedClass) {
      toast({
        title: "Class selection required",
        description: "Please select a class to generate suggestions.",
        variant: "destructive",
      });
      return;
    }
    
    setSuggestionsLoading(true);
    
    try {
      // Create a unique key for caching
      const promptKey = `${selectedClass}-${activityType}`;
      
      // Check if we have cached suggestions
      const cachedSuggestions = getSuggestionsFromCache(promptKey);
      
      if (cachedSuggestions && navigator.onLine === false) {
        setSuggestions(cachedSuggestions);
        toast({
          title: "Using cached suggestions",
          description: "You're offline. Using previously cached suggestions.",
        });
      } else {
        // Create prompt
        const prompt = createSuggestionPrompt(selectedClass, activityType);
        
        // Get suggestions from API
        const response = await getTeachingPlanSuggestions({
          prompt,
          className: selectedClass,
          activityType
        });
        
        setSuggestions(response.suggestions);
        
        // Cache suggestions for offline use
        cacheSuggestions(promptKey, response.suggestions);
      }
    } catch (error) {
      toast({
        title: "Failed to generate suggestions",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setSuggestionsLoading(false);
    }
  };
  
  // Add suggestions to activities
  const addSuggestionsToActivities = () => {
    if (!suggestions) return;
    
    const currentActivities = form.getValues('activities');
    const updatedActivities = currentActivities 
      ? `${currentActivities}\n\n${suggestions}` 
      : suggestions;
    
    form.setValue('activities', updatedActivities);
    toast({
      title: "Suggestions added",
      description: "AI-generated suggestions have been added to the activities.",
    });
  };
  
  // Watch for changes in type and startDate to update endDate
  const selectedType = form.watch('type');
  const selectedStartDate = form.watch('startDate');
  const selectedClass = form.watch('class');
  
  // Filter available classes for teachers
  const availableClasses = user?.role === 'admin' 
    ? classOptions 
    : user?.assignedClasses || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Plan Type</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    updateEndDate(selectedStartDate, value);
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select plan type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teachingPlanTypeOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
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
                    {availableClasses.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
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
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      updateEndDate(e.target.value, selectedType);
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
                  <Input 
                    type="date" 
                    {...field} 
                    min={selectedStartDate}
                  />
                </FormControl>
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
          name="activities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Activities</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="List the activities for this plan" 
                  className="resize-none"
                  rows={5}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
              
              <div className="mt-2">
                <div className="flex flex-wrap space-x-2 space-y-1 items-center">
                  <p className="text-sm font-medium">Get AI suggestions for:</p>
                  
                  <Select
                    onValueChange={setActivityType}
                    defaultValue={activityType}
                  >
                    <SelectTrigger className="w-auto">
                      <SelectValue placeholder="Select activity type" />
                    </SelectTrigger>
                    <SelectContent>
                      {activityTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    type="button" 
                    size="sm"
                    onClick={generateSuggestions}
                    disabled={suggestionsLoading}
                  >
                    {suggestionsLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Get Suggestions
                  </Button>
                </div>
              </div>
              
              {suggestions && (
                <Card className="mt-3 bg-purple-50">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="text-sm font-medium text-purple-800">DeepSeek AI Suggestions</h4>
                      <Button 
                        type="button" 
                        variant="link" 
                        size="sm" 
                        className="text-purple-600 p-0"
                        onClick={addSuggestionsToActivities}
                      >
                        <span className="text-xs">Add to activities</span>
                      </Button>
                    </div>
                    <div className="text-sm whitespace-pre-line">
                      {suggestions}
                    </div>
                  </CardContent>
                </Card>
              )}
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
                  placeholder="Describe the learning goals for this plan" 
                  className="resize-none"
                  rows={3}
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Update Plan' : 'Save Plan'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TeachingPlanForm;
