import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Student } from "@shared/schema";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  FileText,
  Edit,
  Trash2,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface StudentListProps {
  onAddStudent: () => void;
  onEditStudent: (student: Student) => void;
  onViewProgress: (student: Student) => void;
}

export default function StudentList({ onAddStudent, onEditStudent, onViewProgress }: StudentListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for filters
  const [classFilter, setClassFilter] = useState<string>("all");
  const [abilityFilter, setAbilityFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [searchFilter, setSearchFilter] = useState<string>("");
  
  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  
  // Fetch students
  const { data: students = [], isLoading, isError } = useQuery({
    queryKey: ["/api/students", classFilter, teacherFilter],
    queryFn: async ({ queryKey }) => {
      const [_, classFilter, teacherFilter] = queryKey as string[];
      let url = "/api/students";
      
      const params = new URLSearchParams();
      if (classFilter !== "all") params.append("class", classFilter);
      if (teacherFilter !== "all") params.append("teacherId", teacherFilter);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await apiRequest("GET", url);
      return await res.json() as Student[];
    },
  });
  
  // Fetch teachers if user is admin
  const { data: teachers = [] } = useQuery({
    queryKey: ["/api/teachers"],
    enabled: user?.role === "admin",
  });
  
  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      await apiRequest("DELETE", `/api/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Student Deleted",
        description: "Student has been deleted successfully.",
      });
      setDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: `Failed to delete student: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Filter students based on all criteria
  const filteredStudents = students.filter((student) => {
    // Apply ability filter
    if (abilityFilter !== "all" && student.learningAbility !== abilityFilter) {
      return false;
    }
    
    // Apply search filter
    if (searchFilter && !student.name.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    
    return true;
  });
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [classFilter, abilityFilter, teacherFilter, searchFilter]);
  
  // Handle delete confirmation
  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (studentToDelete) {
      deleteStudentMutation.mutate(studentToDelete.id);
    }
  };
  
  if (isError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold">Error Loading Students</h3>
            <p className="text-sm text-gray-500 mt-2">
              There was a problem loading the student data. Please try again later.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/students"] })}
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
        <CardTitle>Students</CardTitle>
        <Button onClick={onAddStudent}>
          <Plus className="h-4 w-4 mr-2" />
          Add Student
        </Button>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div>
            <Label htmlFor="class-filter">Class</Label>
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
          
          <div>
            <Label htmlFor="ability-filter">Learning Ability</Label>
            <Select
              value={abilityFilter}
              onValueChange={setAbilityFilter}
            >
              <SelectTrigger id="ability-filter">
                <SelectValue placeholder="All Abilities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Abilities</SelectItem>
                <SelectItem value="Talented">Talented</SelectItem>
                <SelectItem value="Average">Average</SelectItem>
                <SelectItem value="Slow Learner">Slow Learner</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {user?.role === "admin" && (
            <div>
              <Label htmlFor="teacher-filter">Teacher</Label>
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
          
          <div>
            <Label htmlFor="search-filter">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                id="search-filter"
                placeholder="Student name"
                className="pl-8"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        {/* Students Table */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
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
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Learning Ability</TableHead>
                    <TableHead>Writing Speed</TableHead>
                    {user?.role === "admin" && <TableHead>Teacher</TableHead>}
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={user?.role === "admin" ? 7 : 6} className="text-center h-24">
                        No students found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              {student.photoUrl ? (
                                <img
                                  className="h-10 w-10 rounded-full object-cover"
                                  src={student.photoUrl}
                                  alt={student.name}
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
                        <TableCell>{student.class}</TableCell>
                        <TableCell>{student.age} years</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              student.learningAbility === "Talented"
                                ? "bg-green-100 text-green-800 hover:bg-green-100"
                                : student.learningAbility === "Average"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : "bg-red-100 text-red-800 hover:bg-red-100"
                            }
                          >
                            {student.learningAbility}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              student.writingSpeed === "Speed Writing"
                                ? "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                : student.writingSpeed === "Slow Writing"
                                ? "bg-orange-100 text-orange-800 hover:bg-orange-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                            }
                          >
                            {student.writingSpeed}
                          </Badge>
                        </TableCell>
                        {user?.role === "admin" && (
                          <TableCell>
                            {teachers.find((t: any) => t.id === student.teacherId)?.name || "Unassigned"}
                          </TableCell>
                        )}
                        <TableCell className="text-right whitespace-nowrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewProgress(student)}
                            className="text-purple-600 hover:text-purple-900 mr-1"
                          >
                            <FileText className="h-4 w-4" />
                            <span className="sr-only">View Progress</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditStudent(student)}
                            className="text-indigo-600 hover:text-indigo-900 mr-1"
                          >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(student)}
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
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          onClick={() => setCurrentPage(i + 1)}
                          isActive={currentPage === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} 
                        disabled={currentPage === totalPages}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {studentToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={deleteStudentMutation.isPending}
            >
              {deleteStudentMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
