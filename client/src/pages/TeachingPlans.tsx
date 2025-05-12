import { useState } from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { PlanList } from "@/components/ui/plans/PlanList";
import { PlanForm } from "@/components/ui/plans/PlanForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function TeachingPlans() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [viewPlanId, setViewPlanId] = useState<number | null>(null);
  const [editPlanId, setEditPlanId] = useState<number | null>(null);
  const [deletePlanId, setDeletePlanId] = useState<number | null>(null);

  const handleAddClick = () => {
    setIsAddOpen(true);
  };

  const handleViewClick = (planId: number) => {
    setViewPlanId(planId);
  };

  const handleEditClick = (planId: number) => {
    setEditPlanId(planId);
  };

  const handleDeleteClick = (planId: number) => {
    setDeletePlanId(planId);
  };

  const handleDeleteConfirm = async () => {
    if (deletePlanId) {
      try {
        await apiRequest("DELETE", `/api/plans/${deletePlanId}`, {});
        toast({
          title: "Success",
          description: "Teaching plan has been deleted successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/plans'] });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to delete teaching plan: ${error}`,
          variant: "destructive",
        });
      } finally {
        setDeletePlanId(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeletePlanId(null);
  };

  const handleFormSuccess = () => {
    setIsAddOpen(false);
    setEditPlanId(null);
    queryClient.invalidateQueries({ queryKey: ['/api/plans'] });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Teaching Plans" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Teaching Plans</h2>
              <p className="mt-1 text-sm text-gray-500">Create and manage teaching plans for each class</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <Button 
                onClick={handleAddClick}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Plan
              </Button>
            </div>
          </div>
          
          <PlanList 
            onView={handleViewClick}
            onEdit={handleEditClick} 
            onDelete={handleDeleteClick} 
          />
        </main>
      </div>

      {/* Add Plan Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Teaching Plan</DialogTitle>
            <DialogDescription>
              Create a new teaching plan with AI-powered suggestions.
            </DialogDescription>
          </DialogHeader>
          <PlanForm 
            onSuccess={handleFormSuccess}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* View Plan Dialog */}
      <Dialog open={!!viewPlanId} onOpenChange={(open) => !open && setViewPlanId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>View Teaching Plan</DialogTitle>
          </DialogHeader>
          {/* A read-only version of the plan details would go here */}
          <div className="mt-4 flex justify-end">
            <Button 
              variant="outline" 
              onClick={() => setViewPlanId(null)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Plan Dialog */}
      <Dialog open={!!editPlanId} onOpenChange={(open) => !open && setEditPlanId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Teaching Plan</DialogTitle>
            <DialogDescription>
              Update this teaching plan.
            </DialogDescription>
          </DialogHeader>
          {editPlanId && (
            <PlanForm 
              planId={editPlanId}
              onSuccess={handleFormSuccess}
              onCancel={() => setEditPlanId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deletePlanId !== null} onOpenChange={handleDeleteCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this teaching plan.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
