import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import StudentCard from './StudentCard';
import { Input } from '@/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface StudentListProps {
  onEditStudent: (student: any) => void;
  onViewProgress: (student: any) => void;
  onAddProgress: (student: any) => void;
  refreshTrigger?: number;
}

const StudentList: React.FC<StudentListProps> = ({ 
  onEditStudent, 
  onViewProgress, 
  onAddProgress,
  refreshTrigger = 0
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === 'admin';
  
  // State for filtering and deleting
  const [classFilter, setClassFilter] = useState<string>('all');
  const [teacherFilter, setTeacherFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [studentToDelete, setStudentToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch students data
  const { data: students = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/students', refreshTrigger],
    staleTime: 0, // Always fetch fresh data
  });
  
  // Fetch teachers for admin filter
  const { data: teachers = [] } = useQuery({
    queryKey: ['/api/users/teachers'],
    enabled: isAdmin,
  });

  // Filter students
  const filteredStudents = students.filter((student: any) => {
    // Filter by class
    if (classFilter !== 'all' && student.class !== classFilter) {
      return false;
    }
    
    // Filter by teacher (admin only)
    if (isAdmin && teacherFilter !== 'all' && student.teacherId !== parseInt(teacherFilter)) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !student.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const handleDeleteConfirm = async () => {
    if (!studentToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await apiRequest('DELETE', `/api/students/${studentToDelete.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to delete student');
      }
      
      toast({
        title: 'Student deleted',
        description: `${studentToDelete.name} has been deleted successfully.`,
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: 'Failed to delete student',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setStudentToDelete(null);
    }
  };

  const cancelDelete = () => {
    setStudentToDelete(null);
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
        <p>Error loading students. Please try again later.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter controls */}
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <Select
              value={classFilter}
              onValueChange={setClassFilter}
            >
              <SelectTrigger id="class-filter">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="Nursery">Nursery</SelectItem>
                <SelectItem value="LKG">LKG</SelectItem>
                <SelectItem value="UKG">UKG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isAdmin && (
            <div>
              <label htmlFor="teacher-filter" className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
              <Select
                value={teacherFilter}
                onValueChange={setTeacherFilter}
              >
                <SelectTrigger id="teacher-filter">
                  <SelectValue placeholder="All Teachers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {teachers.map((teacher: any) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="lg:col-span-2">
            <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Input
                type="text"
                id="search-filter"
                placeholder="Search by student name"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Students grid */}
      {filteredStudents.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student: any) => (
            <StudentCard
              key={student.id}
              student={student}
              onEdit={onEditStudent}
              onDelete={setStudentToDelete}
              onViewProgress={onViewProgress}
              onAddProgress={onAddProgress}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No students found matching the selected filters.</p>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!studentToDelete} onOpenChange={() => !isDeleting && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {studentToDelete?.name}? This action cannot be undone
              and all associated data including progress entries will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={cancelDelete}>Cancel</AlertDialogCancel>
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
    </div>
  );
};

export default StudentList;
