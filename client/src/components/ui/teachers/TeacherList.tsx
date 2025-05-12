import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, KeyRound, Trash2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";

interface TeacherListProps {
  onEdit: (teacherId: number) => void;
  onResetPassword: (teacherId: number) => void;
  onDelete: (teacherId: number) => void;
}

export function TeacherList({ onEdit, onResetPassword, onDelete }: TeacherListProps) {
  const { toast } = useToast();
  const [deleteTeacherId, setDeleteTeacherId] = useState<number | null>(null);

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['/api/teachers'],
  });

  const handleDeleteClick = (teacherId: number) => {
    setDeleteTeacherId(teacherId);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTeacherId) {
      try {
        await apiRequest("DELETE", `/api/teachers/${deleteTeacherId}`, {});
        toast({
          title: "Success",
          description: "Teacher has been deleted successfully",
        });
        // The query will be invalidated elsewhere
      } catch (error) {
        toast({
          title: "Error",
          description: `Failed to delete teacher: ${error}`,
          variant: "destructive",
        });
      } finally {
        setDeleteTeacherId(null);
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteTeacherId(null);
  };

  const getTeacherInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Teacher Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Assigned Classes</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teachers && teachers.length > 0 ? (
                  teachers.map((teacher: any) => (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 font-medium">
                              {getTeacherInitials(teacher.name)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">{teacher.email}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {teacher.classes && teacher.classes.length > 0 ? (
                            teacher.classes.map((classItem: string, index: number) => {
                              const bgColorClass = 
                                classItem === "Nursery" ? "bg-yellow-100 text-yellow-800" :
                                classItem === "LKG" ? "bg-blue-100 text-blue-800" :
                                "bg-green-100 text-green-800";
                              
                              return (
                                <Badge key={index} className={bgColorClass}>
                                  {classItem}
                                </Badge>
                              );
                            })
                          ) : (
                            <span className="text-sm text-gray-500">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {teacher.studentCount} students
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onEdit(teacher.id)}
                          className="mr-2"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => onResetPassword(teacher.id)}
                          className="mr-2 text-yellow-600 hover:text-yellow-700"
                        >
                          <KeyRound className="h-4 w-4" />
                          <span className="sr-only">Reset Password</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteClick(teacher.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No teachers found. Add a new teacher to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={deleteTeacherId !== null} onOpenChange={handleDeleteCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the teacher and remove all class assignments.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
