import { useState } from 'react';
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { TeacherList } from "@/components/ui/teachers/TeacherList";
import { TeacherForm } from "@/components/ui/teachers/TeacherForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useQueryClient } from "@tanstack/react-query";

export default function ManageTeachers() {
  const queryClient = useQueryClient();
  
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editTeacherId, setEditTeacherId] = useState<number | null>(null);
  const [resetPasswordTeacherId, setResetPasswordTeacherId] = useState<number | null>(null);
  
  const handleAddClick = () => {
    setIsAddOpen(true);
  };

  const handleEditClick = (teacherId: number) => {
    setEditTeacherId(teacherId);
  };

  const handleResetPasswordClick = (teacherId: number) => {
    setResetPasswordTeacherId(teacherId);
  };

  const handleFormSuccess = () => {
    setIsAddOpen(false);
    setEditTeacherId(null);
    setResetPasswordTeacherId(null);
    queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header title="Manage Teachers" />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Teacher Management</h2>
              <p className="mt-1 text-sm text-gray-500">Add, edit, and delete teacher accounts</p>
            </div>
            
            <div className="mt-4 md:mt-0">
              <Button 
                onClick={handleAddClick}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Teacher
              </Button>
            </div>
          </div>
          
          <TeacherList 
            onEdit={handleEditClick}
            onResetPassword={handleResetPasswordClick}
            onDelete={(teacherId) => {}} // This is handled internally in the component
          />
        </main>
      </div>

      {/* Add Teacher Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>
              Create a new teacher account and assign classes.
            </DialogDescription>
          </DialogHeader>
          <TeacherForm 
            onSuccess={handleFormSuccess}
            onCancel={() => setIsAddOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={!!editTeacherId} onOpenChange={(open) => !open && setEditTeacherId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>
              Update this teacher's information and class assignments.
            </DialogDescription>
          </DialogHeader>
          {editTeacherId && (
            <TeacherForm 
              teacherId={editTeacherId}
              onSuccess={handleFormSuccess}
              onCancel={() => setEditTeacherId(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordTeacherId} onOpenChange={(open) => !open && setResetPasswordTeacherId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset the password for this teacher.
            </DialogDescription>
          </DialogHeader>
          {resetPasswordTeacherId && (
            <TeacherForm 
              teacherId={resetPasswordTeacherId}
              isResetPassword={true}
              onSuccess={handleFormSuccess}
              onCancel={() => setResetPasswordTeacherId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
