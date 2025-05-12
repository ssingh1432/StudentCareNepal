import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { classLevels } from "@shared/schema";

export function AssignStudentsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [classFilter, setClassFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [assignments, setAssignments] = useState<{ [key: number]: number }>({});
  const [isSaving, setIsSaving] = useState(false);

  // Fetch students with their current teacher assignments
  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/students', { classFilter, teacherFilter, searchQuery }],
  });

  // Fetch teachers for the dropdown
  const { data: teachers, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['/api/teachers'],
  });

  // Initialize assignments when students data is loaded
  useState(() => {
    if (students && students.length > 0) {
      const initialAssignments = students.reduce((acc: { [key: number]: number }, student: any) => {
        acc[student.id] = student.teacherId;
        return acc;
      }, {});
      setAssignments(initialAssignments);
    }
  });

  // Handle teacher assignment change
  const handleAssignmentChange = (studentId: number, teacherId: number) => {
    setAssignments((prev) => ({
      ...prev,
      [studentId]: teacherId,
    }));
  };

  // Save assignments mutation
  const saveAssignmentsMutation = useMutation({
    mutationFn: async (assignments: { [key: number]: number }) => {
      return apiRequest("POST", "/api/students/assign", { assignments });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student assignments have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update student assignments: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Save all assignments
  const handleSaveAssignments = async () => {
    setIsSaving(true);
    try {
      await saveAssignmentsMutation.mutateAsync(assignments);
    } finally {
      setIsSaving(false);
    }
  };

  // Check if any assignments have changed
  const hasChanges = () => {
    if (!students) return false;
    
    return students.some((student: any) => {
      return assignments[student.id] !== student.teacherId;
    });
  };

  // Get teacher name by ID
  const getTeacherName = (teacherId: number) => {
    if (!teachers) return "Loading...";
    const teacher = teachers.find((t: any) => t.id === teacherId);
    return teacher ? teacher.name : "Unknown";
  };

  // Get teacher's assigned classes
  const getTeacherClasses = (teacherId: number) => {
    if (!teachers) return [];
    const teacher = teachers.find((t: any) => t.id === teacherId);
    return teacher ? teacher.classes || [] : [];
  };

  // Get student photo or initials
  const getStudentDisplay = (student: any) => {
    if (student.photoUrl) {
      return (
        <img
          src={student.photoUrl}
          alt={student.name}
          className="h-10 w-10 rounded-full object-cover"
        />
      );
    } else {
      return (
        <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
          <span className="text-purple-600 font-medium">
            {student.name.charAt(0)}
          </span>
        </div>
      );
    }
  };

  // Get class badge class
  const getClassBadgeClass = (className: string) => {
    const normalized = className.toLowerCase();
    return `class-tag-${normalized}`;
  };

  const isLoading = isLoadingStudents || isLoadingTeachers;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Assign Students to Teachers</CardTitle>
        <Button 
          onClick={handleSaveAssignments} 
          disabled={isSaving || !hasChanges() || isLoading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Assignments
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Select
              value={classFilter}
              onValueChange={setClassFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classLevels.map((level) => (
                  <SelectItem key={level} value={level}>{level}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={teacherFilter}
              onValueChange={setTeacherFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by current teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Teachers</SelectItem>
                {teachers?.map((teacher: any) => (
                  <SelectItem key={teacher.id} value={teacher.id.toString()}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search students..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="rounded-md border">
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
                {students && students.length > 0 ? (
                  students.map((student: any) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {getStudentDisplay(student)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getClassBadgeClass(student.class)}>
                          {student.class}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {getTeacherName(student.teacherId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={assignments[student.id]?.toString() || student.teacherId.toString()}
                          onValueChange={(value) => handleAssignmentChange(student.id, parseInt(value))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                          <SelectContent>
                            {teachers?.map((teacher: any) => {
                              // Only show teachers who are assigned to the student's class
                              const teacherClasses = getTeacherClasses(teacher.id);
                              if (teacherClasses.includes(student.class)) {
                                return (
                                  <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                    {teacher.name}
                                  </SelectItem>
                                );
                              }
                              return null;
                            })}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No students found. Try adjusting your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
