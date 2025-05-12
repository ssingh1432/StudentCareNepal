import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { MoreVertical, Pencil, Trash2, KeyRound, Loader2 } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface TeacherListProps {
  onEditTeacher: (teacher: any) => void;
  refreshTrigger?: number;
}

const TeacherList: React.FC<TeacherListProps> = ({ 
  onEditTeacher,
  refreshTrigger = 0
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [teacherToDelete, setTeacherToDelete] = useState<any>(null);
  const [teacherToResetPassword, setTeacherToResetPassword] = useState<any>(null);
  const [newPassword, setNewPassword] = useState<string>('');
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isResettingPassword, setIsResettingPassword] = useState<boolean>(false);
  
  // Fetch teachers data
  const { data: teachers = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/users/teachers', refreshTrigger],
    staleTime: 0,
  });

  // Filter teachers by search term
  const filteredTeachers = teachers.filter((teacher: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return teacher.name.toLowerCase().includes(term) || 
           teacher.email.toLowerCase().includes(term);
  });

  const handleDeleteConfirm = async () => {
    if (!teacherToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await apiRequest('DELETE', `/api/users/teachers/${teacherToDelete.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to delete teacher');
      }
      
      toast({
        title: 'Teacher deleted',
        description: `${teacherToDelete.name} has been deleted successfully.`,
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast({
        title: 'Failed to delete teacher',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setTeacherToDelete(null);
    }
  };

  const handleResetPasswordConfirm = async () => {
    if (!teacherToResetPassword || !newPassword) return;
    
    setIsResettingPassword(true);
    try {
      const response = await apiRequest('PUT', `/api/users/teachers/${teacherToResetPassword.id}`, {
        password: newPassword
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset password');
      }
      
      toast({
        title: 'Password reset successful',
        description: `Password for ${teacherToResetPassword.name} has been reset.`,
      });
      
      // No need to refetch as the password change doesn't affect the teacher list UI
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Failed to reset password',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsResettingPassword(false);
      setTeacherToResetPassword(null);
      setNewPassword('');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        <p>Error loading teachers. Please try again later.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Search */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search teachers by name or email"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      {/* Teachers grid */}
      {filteredTeachers.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTeachers.map((teacher: any) => (
            <Card key={teacher.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold text-lg">
                        {getInitials(teacher.name)}
                      </div>
                      <div className="ml-3">
                        <h3 className="text-lg font-semibold">{teacher.name}</h3>
                        <p className="text-sm text-gray-500">{teacher.email}</p>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditTeacher(teacher)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTeacherToResetPassword(teacher)}>
                          <KeyRound className="mr-2 h-4 w-4" />
                          Reset Password
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setTeacherToDelete(teacher)}
                          className="text-red-600 hover:text-red-700 focus:text-red-700"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Assigned Classes</h4>
                    <div className="flex flex-wrap gap-2">
                      {teacher.classes && teacher.classes.length > 0 ? (
                        teacher.classes.map((className: string) => (
                          <Badge key={className} variant="outline" className="bg-purple-50">
                            {className}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-gray-500">No classes assigned</span>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Students</h4>
                    <div className="text-2xl font-semibold text-gray-900">
                      {teacher.studentCount || 0}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No teachers found matching your search criteria.</p>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog 
        open={!!teacherToDelete} 
        onOpenChange={() => !isDeleting && setTeacherToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teacher</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {teacherToDelete?.name}? This action cannot be undone. 
              Students assigned to this teacher will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Reset password dialog */}
      <AlertDialog 
        open={!!teacherToResetPassword} 
        onOpenChange={() => !isResettingPassword && setTeacherToResetPassword(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a new password for {teacherToResetPassword?.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mb-1"
            />
            <p className="text-xs text-gray-500">
              Password must be at least 6 characters long.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResettingPassword}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleResetPasswordConfirm}
              disabled={isResettingPassword || newPassword.length < 6}
              className="bg-blue-600 hover:bg-blue-700 focus:ring-blue-600"
            >
              {isResettingPassword ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : 'Reset Password'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TeacherList;
