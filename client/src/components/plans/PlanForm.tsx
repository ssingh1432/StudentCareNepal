import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertTeachingPlanSchema } from '@shared/schema';
import { useAuth } from '@/hooks/use-auth';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { getActivitySuggestions, generatePrompt } from '@/lib/deepseek';

// Extend the schema for the form
const planFormSchema = insertTeachingPlanSchema.extend({
  createdBy: z.number().optional(),
  activitySuggestion: z.string().optional(),
});

interface PlanFormProps {
  initialData?: z.infer<typeof planFormSchema>;
  onSuccess: () => void;
  onCancel: () => void;
}

const PlanForm: React.FC<PlanFormProps> = ({
  initialData,
  onSuccess,
  onCancel
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string>('');
  
  const form = useForm<z.infer<typeof planFormSchema>>({
    resolver: zodResolver(planFormSchema),
    defaultValues: initialData || {
      type: 'Weekly',
      class: 'Nursery',
      title: '',
      description: '',
      activities: '',
      goals: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 week from now
      createdBy: user?.id,
    },
  });

  // Helper to update the end date based on plan type and start date
  const updateEndDate = (startDate: string, planType: string) => {
    const start = new Date(startDate);
    let end: Date;
    
    switch(planType) {
      case 'Annual':
        end = new Date(start);
        end.setFullYear(start.getFullYear() + 1);
        end.setDate(end.getDate() - 1);
        break;
      case 'Monthly':
        end = new Date(start);
        end.setMonth(end.getMonth() + 1);
        end.setDate(end.getDate() - 1);
        break;
      case 'Weekly':
      default:
        end = new Date(start);
        end.setDate(start.getDate() + 7);
        break;
    }
    
    form.setValue('endDate', end.toISOString().split('T')[0]);
  };

  // Generate AI suggestions
  const generateSuggestions = async () => {
    const planType = form.getValues('type');
    const className = form.getValues('class');
    
    if (!className) {
      toast({
        title: 'Missing information',
        description: 'Please select a class before generating suggestions',
        variant: 'destructive',
      });
      return;
    }
    
    setIsGeneratingSuggestion(true);
    try {
      const prompt = generatePrompt(
        className,
        planType === 'Weekly' ? 'short-term' : planType === 'Monthly' ? 'medium-term' : 'long-term',
        5
      );
      
      const result = await getActivitySuggestions(prompt);
      setAiSuggestion(result.suggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: 'Failed to generate suggestions',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  // Add AI suggestions to the activities field
  const addSuggestionsToActivities = () => {
    const currentActivities = form.getValues('activities');
    const updatedActivities = currentActivities 
      ? `${currentActivities}\n\n${aiSuggestion}`
      : aiSuggestion;
    
    form.setValue('activities', updatedActivities);
    setAiSuggestion('');
  };

  const onSubmit = async (values: z.infer<typeof planFormSchema>) => {
    setIsSubmitting(true);
    try {
      // Add current user ID
      values.createdBy = user?.id;
      
      // Remove any non-schema fields
      const { activitySuggestion, ...planData } = values;
      
      const endpoint = initialData ? `/api/plans/${initialData.id}` : '/api/plans';
      const method = initialData ? 'PUT' : 'POST';
      
      const response = await apiRequest(method, endpoint, planData);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save teaching plan');
      }
      
      toast({
        title: `Teaching plan ${initialData ? 'updated' : 'created'} successfully`,
        description: `${values.title} has been ${initialData ? 'updated' : 'created'}.`,
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error saving teaching plan:', error);
      toast({
        title: `Failed to ${initialData ? 'update' : 'create'} teaching plan`,
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
                  onValueChange={(value) => {
                    field.onChange(value);
                    updateEndDate(form.getValues('startDate'), value);
                  }}
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
                  placeholder="Brief description of the teaching plan"
                  className="min-h-[80px]"
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
                    onChange={(e) => {
                      field.onChange(e);
                      updateEndDate(e.target.value, form.getValues('type'));
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
                    {...field}
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
                <div className="space-y-2">
                  <Textarea
                    placeholder="List the activities for this plan"
                    className="min-h-[120px]"
                    {...field}
                  />
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateSuggestions}
                      disabled={isGeneratingSuggestion}
                    >
                      {isGeneratingSuggestion ? (
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
                </div>
              </FormControl>
              <FormDescription>
                List the activities to be conducted as part of this plan
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {aiSuggestion && (
          <Alert className="bg-purple-50 border-purple-200">
            <Sparkles className="h-4 w-4 text-purple-500" />
            <AlertTitle>AI Suggestions</AlertTitle>
            <AlertDescription className="mt-2">
              <div className="whitespace-pre-line bg-white p-3 rounded border border-purple-100 text-sm mb-2">
                {aiSuggestion}
              </div>
              <Button
                type="button"
                size="sm"
                onClick={addSuggestionsToActivities}
              >
                Add to Activities
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
                  placeholder="Outline the learning goals for this plan"
                  className="min-h-[80px]"
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
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : initialData ? 'Update Plan' : 'Save Plan'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default PlanForm;
