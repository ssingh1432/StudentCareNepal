import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { ProgressList } from "@/components/ui/progress/ProgressList";
import { ProgressForm } from "@/components/ui/progress/ProgressForm";
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

export default function ProgressTracking() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [editProgressId, setEditProgressId] = useState<number | null>(null);
  const [deleteProgressId, setDeleteProgressId] = useState<number | null>(null);

  // Check for URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const action = params.get('action');
    const studentId = params.get('studentId');

    if (action === 'add') {
      setIsAddOpen(true);
      if (studentId) {
        setSelectedStudentId(parseInt(studentId));
      }
    }
  }, [location]);

  const handleAddClick = () => {
    setSelectedStudentId(null);
    setIsAddOpen(true);
  };

  const handleEditClick = (progressId: number) => {
    setEditProgressId(progressId);
  };

  const handleDeleteClick = (progressId: number) => {
    setDeleteProgressId(progressId);
  };

  const handleDeleteConfirm = async () => {
    if (deleteProgressId) {
      try {
        await apiRequest("DELETE", `/api/progress/${deleteProgressId}`, {});
        toast({
          title: "Success",
          description: "Progress entry has been deleted successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to delete progress entry: ${error}`,
          variant: "destructive",
        });
      } finally {
        setDeleteProgressId(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteProgressId(null);
  };

  const handleFormSuccess = () => {
    setIsAddOpen(false);
    setEditProgressId(null);
    queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Progress Tracking" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Progress Tracking</h2>
              <p className="mt-1 text-sm text-gray-500">Monitor and record student development</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <Button 
                onClick={handleAddClick}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Record Progress
              </Button>
            </div>
          </div>
          
          <ProgressList 
            onEdit={handleEditClick} 
            onDelete={handleDeleteClick} 
          />
        </main>
      </div>

      {/* Add Progress Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Record Progress</DialogTitle>
            <DialogDescription>
              Add a new progress entry for a student.
            </DialogDescription>
          </DialogHeader>
          <ProgressForm 
            studentId={selectedStudentId || undefined}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Progress Dialog */}
      <Dialog open={!!editProgressId} onOpenChange={(open) => !open && setEditProgressId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Progress Entry</DialogTitle>
            <DialogDescription>
              Update this progress entry.
            </DialogDescription>
          </DialogHeader>
          {editProgressId && (
            <ProgressForm 
              progressId={editProgressId}
              onSuccess={handleFormSuccess}
              onCancel={() => setEditProgressId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteProgressId !== null} onOpenChange={handleDeleteCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this progress entry.
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
