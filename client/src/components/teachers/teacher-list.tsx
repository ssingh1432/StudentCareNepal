import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User } from "@shared/schema";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Search, Plus, Edit, Trash2, AlertCircle, KeyRound } from "lucide-react";
import { Label } from "@/components/ui/label";

interface TeacherListProps {
  onAddTeacher: () => void;
  onEditTeacher: (teacher: User) => void;
}

export default function TeacherList({ onAddTeacher, onEditTeacher }: TeacherListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [searchTerm, setSearchTerm] = useState("");
  const [teacherToDelete, setTeacherToDelete] = useState<User | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [teacherToResetPassword, setTeacherToResetPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  
  // Fetch teachers
  const { data: teachers = [], isLoading, isError } = useQuery({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/teachers");
      return await res.json() as User[];
    },
  });
  
  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: async (teacherId: number) => {
      await apiRequest("DELETE", `/api/teachers/${teacherId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({
        title: "Teacher Deleted",
        description: "Teacher has been deleted successfully.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: `Failed to delete teacher: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ teacherId, password }: { teacherId: number, password: string }) => {
      await apiRequest("PUT", `/api/teachers/${teacherId}`, { password });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({
        title: "Password Reset",
        description: "Password has been reset successfully.",
      });
      setIsResetPasswordDialogOpen(false);
      setNewPassword("");
    },
    onError: (error) => {
      toast({
        title: "Password Reset Failed",
        description: `Failed to reset password: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Filter teachers based on search term
  const filteredTeachers = teachers.filter(teacher => 
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handler for delete button
  const handleDeleteClick = (teacher: User) => {
    setTeacherToDelete(teacher);
    setIsDeleteDialogOpen(true);
  };
  
  // Handler for reset password button
  const handleResetPasswordClick = (teacher: User) => {
    setTeacherToResetPassword(teacher);
    setIsResetPasswordDialogOpen(true);
  };
  
  // Handler for confirming deletion
  const handleConfirmDelete = () => {
    if (teacherToDelete) {
      deleteTeacherMutation.mutate(teacherToDelete.id);
    }
  };
  
  // Handler for confirming password reset
  const handleConfirmResetPassword = () => {
    if (teacherToResetPassword && newPassword) {
      resetPasswordMutation.mutate({
        teacherId: teacherToResetPassword.id,
        password: newPassword
      });
    }
  };
  
  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold">Error Loading Teachers</h3>
            <p className="text-sm text-gray-500 mt-2">
              There was a problem loading the teacher data. Please try again later.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/teachers"] })}
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between sm:items-center space-y-2 sm:space-y-0">
        <CardTitle>Teachers</CardTitle>
        <Button onClick={onAddTeacher}>
          <Plus className="h-4 w-4 mr-2" />
          Add Teacher
        </Button>
      </CardHeader>
      
      <CardContent>
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search teachers by name or email"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Teachers Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : (
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
                {filteredTeachers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      No teachers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 font-medium">
                              {teacher.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {teacher.email}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {teacher.assignedClasses.map((cls) => (
                            <Badge
                              key={cls}
                              variant="outline"
                              className={
                                cls === "Nursery"
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                  : cls === "LKG"
                                  ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                  : "bg-green-100 text-green-800 hover:bg-green-100"
                              }
                            >
                              {cls}
                            </Badge>
                          ))}
                          {teacher.assignedClasses.length === 0 && (
                            <span className="text-sm text-gray-500">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {/* This would ideally be fetched, but for now we'll display a placeholder */}
                        -
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResetPasswordClick(teacher)}
                          className="text-yellow-600 hover:text-yellow-900 mr-1"
                        >
                          <KeyRound className="h-4 w-4" />
                          <span className="sr-only">Reset Password</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditTeacher(teacher)}
                          className="text-indigo-600 hover:text-indigo-900 mr-1"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(teacher)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {teacherToDelete?.name}'s account and remove them from all assigned classes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Reset Password Dialog */}
      <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set a new password for {teacherToResetPassword?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmResetPassword}
              disabled={!newPassword || resetPasswordMutation.isPending}
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
