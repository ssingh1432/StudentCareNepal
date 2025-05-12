import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StudentList } from "@/components/ui/students/StudentList";
import { StudentForm } from "@/components/ui/students/StudentForm";
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

export default function Students() {
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editStudentId, setEditStudentId] = useState<number | null>(null);
  const [deleteStudentId, setDeleteStudentId] = useState<number | null>(null);

  // Check for URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1]);
    const action = params.get('action');
    if (action === 'add') {
      setIsAddOpen(true);
    }
  }, [location]);

  const handleAddClick = () => {
    setIsAddOpen(true);
  };

  const handleEditClick = (studentId: number) => {
    setEditStudentId(studentId);
  };

  const handleDeleteClick = (studentId: number) => {
    setDeleteStudentId(studentId);
  };

  const handleDeleteConfirm = async () => {
    if (deleteStudentId) {
      try {
        await apiRequest("DELETE", `/api/students/${deleteStudentId}`, {});
        toast({
          title: "Success",
          description: "Student has been deleted successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to delete student: ${error}`,
          variant: "destructive",
        });
      } finally {
        setDeleteStudentId(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteStudentId(null);
  };

  const handleFormSuccess = () => {
    setIsAddOpen(false);
    setEditStudentId(null);
    queryClient.invalidateQueries({ queryKey: ['/api/students'] });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Students" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
              <p className="mt-1 text-sm text-gray-500">Manage all students in the pre-primary section</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <Button 
                onClick={handleAddClick}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>
          
          <StudentList 
            onEdit={handleEditClick} 
            onDelete={handleDeleteClick} 
          />
        </main>
      </div>

      {/* Add Student Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Create a new student profile with their basic information.
            </DialogDescription>
          </DialogHeader>
          <StudentForm 
            onSuccess={handleFormSuccess}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={!!editStudentId} onOpenChange={(open) => !open && setEditStudentId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update this student's information.
            </DialogDescription>
          </DialogHeader>
          {editStudentId && (
            <StudentForm 
              studentId={editStudentId}
              onSuccess={handleFormSuccess}
              onCancel={() => setEditStudentId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteStudentId !== null} onOpenChange={handleDeleteCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student and all associated progress records.
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
