import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MoreHorizontal, 
  Edit, 
  Trash, 
  ChartBar,
  EyeIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { StudentCard } from "./student-card";
import { Student } from "@shared/schema";

interface StudentListProps {
  students: Student[];
  isLoading: boolean;
  onEdit: (student: Student) => void;
  onRefresh: () => void;
}

export function StudentList({ students, isLoading, onEdit, onRefresh }: StudentListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listView, setListView] = useState<'table' | 'cards'>('table');
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Fetch teachers to display teacher names
  const { data: teachers } = useQuery({
    queryKey: ["/api/teachers"],
    enabled: user?.role === "admin",
  });

  // Get teacher name by ID
  const getTeacherName = (teacherId: number) => {
    if (!teachers) return "Loading...";
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? teacher.name : "Unassigned";
  };

  // Handle student deletion
  const handleDelete = async (student: Student) => {
    try {
      await apiRequest("DELETE", `/api/students/${student.id}`);
      toast({
        title: "Student Deleted",
        description: `${student.name} has been deleted successfully.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete student",
        variant: "destructive",
      });
    }
  };

  // Get badge color based on learning ability
  const getLearningAbilityColor = (ability: string) => {
    switch (ability) {
      case "Talented":
        return "bg-green-100 text-green-800";
      case "Average":
        return "bg-yellow-100 text-yellow-800";
      case "Slow Learner":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get badge color based on writing speed
  const getWritingSpeedColor = (speed: string) => {
    switch (speed) {
      case "Speed Writing":
        return "bg-blue-100 text-blue-800";
      case "Slow Writing":
        return "bg-yellow-100 text-yellow-800";
      case "N/A":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get badge color based on class
  const getClassColor = (cls: string) => {
    switch (cls) {
      case "Nursery":
        return "bg-purple-100 text-purple-800";
      case "LKG":
        return "bg-blue-100 text-blue-800";
      case "UKG":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Students</h3>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="ml-2">
              {students.length} Total
            </Badge>
            <div className="ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setListView(listView === 'table' ? 'cards' : 'table')}
              >
                {listView === 'table' ? 'Card View' : 'Table View'}
              </Button>
            </div>
          </div>
        </div>

        {listView === 'table' ? (
          <div className="overflow-x-auto">
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
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="flex items-center">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="ml-4">
                            <Skeleton className="h-4 w-24 mb-2" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      {user?.role === "admin" && <TableCell><Skeleton className="h-4 w-24" /></TableCell>}
                      <TableCell><Skeleton className="h-4 w-24 float-right" /></TableCell>
                    </TableRow>
                  ))
                ) : students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user?.role === "admin" ? 7 : 6} className="text-center py-6 text-gray-500">
                      No students found. Add a new student to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
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
                                  {student.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-500">
                              {student.parentContact ? `Parent: ${student.parentContact}` : "No parent contact"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getClassColor(student.class)}>
                          {student.class}
                        </Badge>
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
                        <Badge className={getWritingSpeedColor(student.writingSpeed || "N/A")}>
                          {student.writingSpeed || "N/A"}
                        </Badge>
                      </TableCell>
                      {user?.role === "admin" && (
                        <TableCell className="text-sm text-gray-500">
                          {getTeacherName(student.teacherId)}
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Open menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <Link href={`/progress?studentId=${student.id}`}>
                              <DropdownMenuItem>
                                <EyeIcon className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                            </Link>
                            <Link href={`/progress?action=add&studentId=${student.id}`}>
                              <DropdownMenuItem>
                                <ChartBar className="mr-2 h-4 w-4" />
                                Add Progress
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onEdit(student)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => {
                                setStudentToDelete(student);
                                setDeleteDialogOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(6).fill(0).map((_, i) => (
                <div key={i} className="border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <Skeleton className="h-6 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="p-4">
                    <Skeleton className="h-24 w-full" />
                  </div>
                  <div className="p-4 bg-gray-50 border-t border-gray-200">
                    <Skeleton className="h-8 w-full" />
                  </div>
                </div>
              ))
            ) : students.length === 0 ? (
              <div className="col-span-3 text-center py-12">
                <p className="text-gray-500">No students found. Add a new student to get started.</p>
              </div>
            ) : (
              students.map((student) => (
                <StudentCard 
                  key={student.id} 
                  student={student} 
                  teacherName={user?.role === "admin" ? getTeacherName(student.teacherId) : ""}
                  onEdit={() => onEdit(student)}
                  onDelete={() => {
                    setStudentToDelete(student);
                    setDeleteDialogOpen(true);
                  }}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {studentToDelete?.name}'s record. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (studentToDelete) {
                  handleDelete(studentToDelete);
                  setStudentToDelete(null);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
