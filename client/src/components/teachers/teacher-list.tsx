import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit, Trash, UserCog } from "lucide-react";
import { Teacher, User } from "@shared/schema";

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { TeacherForm } from "@/components/teachers/teacher-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type TeacherWithUser = Teacher & { user: User };

export function TeacherList() {
  const { toast } = useToast();
  const [addTeacherOpen, setAddTeacherOpen] = useState(false);
  const [editTeacherData, setEditTeacherData] = useState<TeacherWithUser | null>(null);
  const [deleteTeacherId, setDeleteTeacherId] = useState<number | null>(null);

  const { data: teachers = [], isLoading } = useQuery<TeacherWithUser[]>({
    queryKey: ["/api/teachers"],
  });

  const handleDeleteTeacher = async () => {
    if (!deleteTeacherId) return;

    try {
      await apiRequest("DELETE", `/api/admin/teachers/${deleteTeacherId}`);
      
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      
      toast({
        title: "Teacher deleted",
        description: "The teacher has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete teacher",
        variant: "destructive",
      });
    } finally {
      setDeleteTeacherId(null);
    }
  };

  const formatClassLabel = (classType: string) => {
    switch (classType) {
      case "nursery":
        return "Nursery";
      case "lkg":
        return "LKG";
      case "ukg":
        return "UKG";
      default:
        return classType;
    }
  };

  const columns = [
    {
      accessorKey: "user.name",
      header: "Name",
      cell: ({ row }) => {
        const teacher = row.original;
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-purple-600 font-medium">{teacher.user.name.substring(0, 2).toUpperCase()}</span>
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {teacher.user.name}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "user.email",
      header: "Email",
      cell: ({ row }) => {
        const email = row.getValue("user.email") as string;
        return <div className="text-sm text-gray-900">{email}</div>;
      },
    },
    {
      accessorKey: "assignedClasses",
      header: "Assigned Classes",
      cell: ({ row }) => {
        const classes = row.original.assignedClasses as string[];
        return (
          <div className="flex flex-wrap gap-1">
            {classes.map((classType) => (
              <Badge key={classType} variant={classType as any}>
                {formatClassLabel(classType)}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const teacher = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditTeacherData(teacher)}
              title="Edit Teacher"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteTeacherId(teacher.user.id)}
              title="Delete Teacher"
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Teachers</h2>
        <Button onClick={() => setAddTeacherOpen(true)}>
          <UserCog className="mr-2 h-4 w-4" /> Add Teacher
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={teachers}
        searchKey="user.name"
        showSearch={true}
      />

      {/* Add Teacher Dialog */}
      <Dialog open={addTeacherOpen} onOpenChange={setAddTeacherOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Teacher</DialogTitle>
            <DialogDescription>
              Create a new teacher account. They will be able to log in with these credentials.
            </DialogDescription>
          </DialogHeader>
          <TeacherForm
            onSuccess={() => setAddTeacherOpen(false)}
            onCancel={() => setAddTeacherOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog
        open={!!editTeacherData}
        onOpenChange={(open) => !open && setEditTeacherData(null)}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>
              Update teacher information and class assignments.
            </DialogDescription>
          </DialogHeader>
          {editTeacherData && (
            <TeacherForm
              initialData={{
                id: editTeacherData.user.id,
                name: editTeacherData.user.name,
                email: editTeacherData.user.email,
                assignedClasses: editTeacherData.assignedClasses,
              }}
              isEditMode={true}
              onSuccess={() => setEditTeacherData(null)}
              onCancel={() => setEditTeacherData(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTeacherId}
        onOpenChange={(open) => !open && setDeleteTeacherId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the teacher account and unassign all their students.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeacher}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
