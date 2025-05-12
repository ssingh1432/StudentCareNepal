import { useState } from "react";
import { Student } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { transformImage } from "@/lib/cloudinary";

interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: () => void;
}

export function StudentList({ students, onEdit, onDelete }: StudentListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const isAdmin = user?.role === "admin";
  
  // Handle delete student
  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    try {
      await apiRequest("DELETE", `/api/students/${studentToDelete.id}`);
      
      toast({
        title: "Student deleted",
        description: `${studentToDelete.name} has been deleted successfully.`,
      });
      
      setStudentToDelete(null);
      onDelete();
    } catch (error) {
      toast({
        title: "Error deleting student",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };
  
  // Get badge color for learning ability
  const getLearningAbilityColor = (ability: string) => {
    switch (ability) {
      case 'Talented':
        return 'bg-green-100 text-green-800';
      case 'Average':
        return 'bg-yellow-100 text-yellow-800';
      case 'Slow Learner':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get badge color for writing speed
  const getWritingSpeedColor = (speed: string) => {
    switch (speed) {
      case 'Speed Writing':
        return 'bg-blue-100 text-blue-800';
      case 'Slow Writing':
        return 'bg-yellow-100 text-yellow-800';
      case 'Not Applicable':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Pagination logic
  const totalPages = Math.ceil(students.length / itemsPerPage);
  const currentStudents = students.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <CardTitle className="text-lg font-medium">Students</CardTitle>
        <Badge className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
          {students.length} Total
        </Badge>
      </CardHeader>
      
      {students.length > 0 ? (
        <>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Learning Ability</TableHead>
                  <TableHead>Writing Speed</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {student.photoUrl ? (
                            <img 
                              src={transformImage(student.photoUrl, { width: 120, height: 120, crop: 'fill' })} 
                              alt={student.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-600 font-medium">
                                {student.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          <div className="text-sm text-gray-500">
                            {student.parentContact && `Parent: ${student.parentContact}`}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">{student.class}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">{student.age} years</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getLearningAbilityColor(student.learningAbility)}>
                        {student.learningAbility}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getWritingSpeedColor(student.writingSpeed)}>
                        {student.writingSpeed}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {student.teacherName || "Unassigned"}
                    </TableCell>
                    <TableCell className="text-right space-x-3">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-purple-600 hover:text-purple-900"
                        onClick={() => {
                          // Navigate to progress view
                          window.location.href = `/progress?studentId=${student.id}`;
                        }}
                      >
                        Progress
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => onEdit(student)}
                      >
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-red-600 hover:text-red-900"
                            onClick={() => setStudentToDelete(student)}
                          >
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete {studentToDelete?.name}'s record and all associated data.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={handleDeleteStudent}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * itemsPerPage, students.length)}
                      </span>{" "}
                      of <span className="font-medium">{students.length}</span> results
                    </p>
                  </div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
                        // Show first page, last page, current page, and pages around current page
                        let pageNumber: number;
                        
                        if (totalPages <= 5) {
                          // Show all pages if total pages is 5 or less
                          pageNumber = index + 1;
                        } else if (currentPage <= 3) {
                          // Show first 5 pages
                          pageNumber = index + 1;
                        } else if (currentPage >= totalPages - 2) {
                          // Show last 5 pages
                          pageNumber = totalPages - 4 + index;
                        } else {
                          // Show current page and 2 pages before and after
                          pageNumber = currentPage - 2 + index;
                        }
                        
                        return (
                          <PaginationItem key={pageNumber}>
                            <PaginationLink
                              isActive={currentPage === pageNumber}
                              onClick={() => setCurrentPage(pageNumber)}
                            >
                              {pageNumber}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <CardContent className="py-12 text-center">
          <p className="text-gray-500">No students found. Add a student to get started.</p>
        </CardContent>
      )}
    </Card>
  );
}
