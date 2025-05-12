import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TeacherForm } from "./teacher-form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  User as UserIcon, 
  Edit, 
  Trash2, 
  Key, 
  Plus,
  Users 
} from "lucide-react";

export function TeacherList() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showAddTeacherForm, setShowAddTeacherForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<(User & { id: number }) | null>(null);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [teacherToReset, setTeacherToReset] = useState<(User & { id: number }) | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<(User & { id: number }) | null>(null);
  const [newPassword, setNewPassword] = useState<string>("");
  
  // Fetch teachers
  const { data: teachers, isLoading } = useQuery<User[]>({
    queryKey: ['/api/teachers'],
  });
  
  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number, password: string }) => {
      return await apiRequest("PUT", `/api/teachers/${id}`, { password });
    },
    onSuccess: () => {
      toast({
        title: "Password Reset",
        description: "Teacher password has been reset successfully.",
      });
      setResetPasswordOpen(false);
      setTeacherToReset(null);
      setNewPassword("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/teachers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      toast({
        title: "Teacher Deleted",
        description: "Teacher account has been removed successfully.",
      });
      setDeleteConfirmOpen(false);
      setTeacherToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter teachers
  const filteredTeachers = teachers?.filter(teacher => {
    if (searchTerm && !teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !teacher.email.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  const handleEditTeacher = (teacher: User & { id: number }) => {
    setEditingTeacher(teacher);
  };
  
  const handleResetPassword = (teacher: User & { id: number }) => {
    setTeacherToReset(teacher);
    setResetPasswordOpen(true);
  };
  
  const handleDeleteTeacher = (teacher: User & { id: number }) => {
    setTeacherToDelete(teacher);
    setDeleteConfirmOpen(true);
  };
  
  const confirmResetPassword = () => {
    if (teacherToReset && newPassword) {
      resetPasswordMutation.mutate({ id: teacherToReset.id, password: newPassword });
    } else {
      toast({
        title: "Error",
        description: "Please enter a new password.",
        variant: "destructive",
      });
    }
  };
  
  const confirmDeleteTeacher = () => {
    if (teacherToDelete) {
      deleteTeacherMutation.mutate(teacherToDelete.id);
    }
  };
  
  // Count students per teacher
  const getStudentCounts = () => {
    // This should use a fetch from an API in a real implementation
    // For now we use mock data
    return {
      1: 28,
      2: 31,
      3: 26
    };
  };
  
  const studentCounts = getStudentCounts();
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Teachers</h2>
        <Button onClick={() => setShowAddTeacherForm(true)}>
          <UserIcon className="mr-2 h-4 w-4" />
          Add Teacher
        </Button>
      </div>
      
      {/* Search control */}
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search teachers by name or email" 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Teachers Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
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
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <Users className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
                  <p className="mt-2 text-gray-500">Loading teachers...</p>
                </TableCell>
              </TableRow>
            ) : filteredTeachers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No teachers found.</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredTeachers?.map(teacher => (
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
                      {teacher.assignedClasses?.map(className => (
                        <Badge 
                          key={className} 
                          variant={className === "Nursery" ? "nursery" : 
                                 className === "LKG" ? "lkg" : "ukg"}
                        >
                          {className}
                        </Badge>
                      ))}
                      {(!teacher.assignedClasses || teacher.assignedClasses.length === 0) && (
                        <span className="text-sm text-gray-500">None assigned</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {studentCounts[teacher.id as keyof typeof studentCounts] || 0} students
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-indigo-600 hover:text-indigo-900"
                      onClick={() => handleEditTeacher(teacher as User & { id: number })}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-yellow-600 hover:text-yellow-900 ml-2"
                      onClick={() => handleResetPassword(teacher as User & { id: number })}
                    >
                      <Key className="h-4 w-4 mr-1" />
                      Reset Password
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-600 hover:text-red-900 ml-2"
                      onClick={() => handleDeleteTeacher(teacher as User & { id: number })}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Add teacher form */}
      {showAddTeacherForm && (
        <TeacherForm 
          open={showAddTeacherForm} 
          onClose={() => setShowAddTeacherForm(false)} 
        />
      )}
      
      {/* Edit teacher form */}
      {editingTeacher && (
        <TeacherForm 
          open={!!editingTeacher} 
          onClose={() => setEditingTeacher(null)} 
          editingTeacher={editingTeacher}
        />
      )}
      
      {/* Reset password dialog */}
      <Dialog open={resetPasswordOpen} onOpenChange={setResetPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for {teacherToReset?.name}. Please enter a new password.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label htmlFor="new-password" className="text-sm font-medium text-gray-700">New Password</label>
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
            <Button
              variant="outline"
              onClick={() => setResetPasswordOpen(false)}
              disabled={resetPasswordMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmResetPassword}
              disabled={resetPasswordMutation.isPending || !newPassword}
            >
              {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Teacher</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {teacherToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteTeacherMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteTeacher}
              disabled={deleteTeacherMutation.isPending}
            >
              {deleteTeacherMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
