import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { StudentCard } from "@/components/ui/student-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Student, User } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { deleteStudent } from "@/lib/api";
import { UserPlus, Search, Filter } from "lucide-react";
import { CLASSES, LEARNING_ABILITIES } from "@shared/schema";

interface StudentListProps {
  user: User;
}

export default function StudentList({ user }: StudentListProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [classFilter, setClassFilter] = useState<string>("all");
  const [learningAbilityFilter, setLearningAbilityFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null);
  const isAdmin = user.role === "admin";

  // Build query string
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (classFilter !== "all") params.append("class", classFilter);
    if (isAdmin && teacherFilter !== "all") params.append("teacherId", teacherFilter);
    if (learningAbilityFilter !== "all") params.append("learningAbility", learningAbilityFilter);
    if (searchQuery) params.append("search", searchQuery);
    return params.toString();
  };

  // Fetch students
  const {
    data: students,
    isLoading,
    isError,
    refetch,
  } = useQuery<Student[]>({
    queryKey: [`/api/students?${buildQueryString()}`],
  });

  // Fetch teachers (for admin)
  const { data: teachers } = useQuery<User[]>({
    queryKey: ["/api/teachers"],
    enabled: isAdmin,
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: deleteStudent,
    onSuccess: () => {
      toast({
        title: "Student deleted",
        description: "Student has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete student: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Handle delete confirmation
  const handleDeleteClick = (id: number) => {
    setStudentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (studentToDelete) {
      deleteMutation.mutate(studentToDelete);
      setDeleteDialogOpen(false);
      setStudentToDelete(null);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
            <p className="mt-1 text-sm text-gray-500">Manage all students in the pre-primary section</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex-shrink-0">
            <Button asChild>
              <Link to="/students/add">
                <UserPlus className="-ml-1 mr-2 h-5 w-5" />
                Add Student
              </Link>
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filter Students</CardTitle>
            <CardDescription>
              Use these filters to find specific students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {CLASSES.map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={learningAbilityFilter} onValueChange={setLearningAbilityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Abilities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Abilities</SelectItem>
                    {LEARNING_ABILITIES.map((ability) => (
                      <SelectItem key={ability} value={ability}>
                        {ability}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {isAdmin && (
                <div>
                  <Select value={teacherFilter} onValueChange={setTeacherFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Teachers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers?.map((teacher) => (
                        <SelectItem key={teacher.id} value={String(teacher.id)}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Search students..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-red-500">Failed to load students</p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : students && students.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {students.map((student) => (
              <StudentCard
                key={student.id}
                student={student}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-gray-500">No students found matching your filters</p>
              {(classFilter !== "all" || learningAbilityFilter !== "all" || teacherFilter !== "all" || searchQuery) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setClassFilter("all");
                    setLearningAbilityFilter("all");
                    setTeacherFilter("all");
                    setSearchQuery("");
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              student and all associated records.
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
    </div>
  );
}
