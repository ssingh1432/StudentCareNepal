import { useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Student, User, TeacherClass } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, UserPlus } from "lucide-react";

export default function StudentAssignmentsPage() {
  const [filters, setFilters] = useState({
    class: "all",
    teacherId: "all",
    search: "",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/protected/students"],
  });

  // Fetch teachers
  const { data: teachers, isLoading: isLoadingTeachers } = useQuery<User[]>({
    queryKey: ["/api/admin/teachers"],
  });

  // Fetch teacher class assignments
  const { data: teacherClasses } = useQuery<Record<number, TeacherClass[]>>({
    queryKey: ["/api/admin/teacher-classes"],
    queryFn: async () => {
      if (!teachers) return {};
      
      const classAssignments: Record<number, TeacherClass[]> = {};
      
      // For each teacher, fetch their classes
      for (const teacher of teachers) {
        const res = await fetch(`/api/admin/teachers/${teacher.id}/classes`, {
          credentials: "include",
        });
        
        if (res.ok) {
          const classes = await res.json();
          classAssignments[teacher.id] = classes;
        }
      }
      
      return classAssignments;
    },
    enabled: !!teachers,
  });

  // Update student assignment mutation
  const updateAssignmentMutation = useMutation({
    mutationFn: async ({ studentId, teacherId }: { studentId: number; teacherId: number }) => {
      await apiRequest("PUT", `/api/protected/students/${studentId}`, {
        teacherId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/students"] });
      toast({
        title: "Assignment updated",
        description: "Student has been assigned to the selected teacher",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update assignment: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter students based on criteria
  const filteredStudents = students
    ? students.filter((student) => {
        if (filters.class !== "all" && student.class !== filters.class) {
          return false;
        }
        
        if (filters.teacherId !== "all" && student.teacherId.toString() !== filters.teacherId) {
          return false;
        }
        
        if (filters.search && !student.name.toLowerCase().includes(filters.search.toLowerCase())) {
          return false;
        }
        
        return true;
      })
    : [];

  // Get teachers eligible to be assigned to a student (must teach the student's class)
  const getEligibleTeachers = (studentClass: string) => {
    if (!teachers || !teacherClasses) return [];
    
    return teachers.filter((teacher) => {
      const classes = teacherClasses[teacher.id] || [];
      return classes.some((tc) => tc.class === studentClass);
    });
  };

  const handleTeacherChange = (studentId: number, teacherId: number) => {
    updateAssignmentMutation.mutate({ studentId, teacherId });
  };

  const isLoading = isLoadingStudents || isLoadingTeachers;

  return (
    <MainLayout title="Assign Students to Teachers">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Assign Students to Teachers</h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage student-teacher assignments
        </p>
      </div>

      <Card className="bg-white p-4 shadow rounded-lg mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <Label htmlFor="assign-class-filter">Class</Label>
            <Select
              value={filters.class}
              onValueChange={(value) => setFilters({ ...filters, class: value })}
            >
              <SelectTrigger id="assign-class-filter">
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
            <Label htmlFor="assign-teacher-filter">Teacher</Label>
            <Select
              value={filters.teacherId}
              onValueChange={(value) => setFilters({ ...filters, teacherId: value })}
            >
              <SelectTrigger id="assign-teacher-filter">
                <SelectValue placeholder="All Teachers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teachers</SelectItem>
                {teachers?.map((teacher) => {
                  const classes = teacherClasses?.[teacher.id]?.map(tc => tc.class).join(", ") || "";
                  return (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.name} ({classes})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="assign-search">Search</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                id="assign-search"
                type="text"
                placeholder="Student name"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Current Teacher</TableHead>
                    <TableHead>Assign To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                        No students found matching the filters
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStudents.map((student) => {
                      const currentTeacher = teachers?.find(t => t.id === student.teacherId);
                      const eligibleTeachers = getEligibleTeachers(student.class);
                      
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full mr-3 overflow-hidden bg-purple-100 flex items-center justify-center">
                              {student.photoUrl ? (
                                <img 
                                  src={student.photoUrl} 
                                  alt={student.name} 
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <UserPlus className="h-5 w-5 text-purple-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{student.name}</div>
                            </div>
                          </TableCell>
                          <TableCell>{student.class}</TableCell>
                          <TableCell>{currentTeacher?.name || "None"}</TableCell>
                          <TableCell>
                            <Select
                              value={student.teacherId.toString()}
                              onValueChange={(value) => handleTeacherChange(student.id, parseInt(value))}
                              disabled={updateAssignmentMutation.isPending}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Select teacher" />
                              </SelectTrigger>
                              <SelectContent>
                                {eligibleTeachers.map((teacher) => (
                                  <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                    {teacher.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
}
