import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanCard } from "./plan-card";
import { TeachingPlan } from "@shared/schema";

interface PlanListProps {
  plans: TeachingPlan[];
  teachers: any[]; // User type with role="teacher"
  isLoading: boolean;
  onEdit: (plan: TeachingPlan) => void;
  onRefresh: () => void;
}

export function PlanList({ plans, teachers, isLoading, onEdit, onRefresh }: PlanListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [planToDelete, setPlanToDelete] = useState<TeachingPlan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Get teacher name by ID
  const getTeacherName = (teacherId: number) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? teacher.name : "Unknown";
  };

  // Handle plan deletion
  const handleDelete = async (plan: TeachingPlan) => {
    try {
      await apiRequest("DELETE", `/api/plans/${plan.id}`);
      toast({
        title: "Plan Deleted",
        description: `${plan.title} has been deleted successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete plan",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-6 w-48 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
                <div className="mt-4 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="mt-5 flex">
                  <Skeleton className="h-8 w-16 mr-2" />
                  <Skeleton className="h-8 w-16 mr-2" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </div>
            </div>
          ))
        ) : plans.length === 0 ? (
          <div className="col-span-3 bg-white p-8 rounded-lg shadow text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Teaching Plans Found</h3>
            <p className="text-gray-500 mb-4">Create your first teaching plan to get started.</p>
          </div>
        ) : (
          plans.map((plan) => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              createdBy={getTeacherName(plan.createdBy)}
              onEdit={() => onEdit(plan)}
              onDelete={() => {
                setPlanToDelete(plan);
                setDeleteDialogOpen(true);
              }}
            />
          ))
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the teaching plan "{planToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (planToDelete) {
                  handleDelete(planToDelete);
                  setPlanToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
