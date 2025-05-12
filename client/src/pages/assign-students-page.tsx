import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Search } from "lucide-react";
import { useLocation, useRouter } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function AssignStudentsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [classFilter, setClassFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [assignments, setAssignments] = useState<Record<number, number>>({});
  const [hasChanges, setHasChanges] = useState(false);
  
  // Redirect non-admin users
  if (user?.role !== "admin") {
    navigate("/");
    return null;
  }

  // Fetch students
  const { data: students, isLoading: loadingStudents } = useQuery({
    queryKey: ["/api/students", classFilter, teacherFilter],
    queryFn: async () => {
      let url = "/api/students";
      const params = new URLSearchParams();
      
      if (classFilter !== "all") {
        params.append("class", classFilter);
      }
      
      if (teacherFilter !== "all") {
        params.append("teacherId", teacherFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url, {
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });

  // Fetch teachers
  const { data: teachers, isLoading: loadingTeachers } = useQuery({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const res = await fetch("/api/teachers", {
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json();
    },
  });

  // Save assignments mutation
  const saveAssignmentsMutation = useMutation({
    mutationFn: async (data: { studentId: number; teacherId: number }) => {
      return apiRequest("POST", "/api/assign-student", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to assign student: ${error.message}`,
      });
    },
  });

  // Initialize assignments from students data
  useEffect(() => {
    if (students) {
      const initialAssignments: Record<number, number> = {};
      students.forEach((student: any) => {
        if (student.teacherId) {
          initialAssignments[student.id] = student.teacherId;
        }
      });
      setAssignments(initialAssignments);
    }
  }, [students]);

  // Filter students based on search term
  const filteredStudents = students
    ? students.filter((student: any) =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const handleAssignmentChange = (studentId: number, teacherId: number) => {
    setAssignments((prev) => {
      const newAssignments = { ...prev, [studentId]: teacherId };
      // Check if there are changes
      const originalTeacherId = students.find((s: any) => s.id === studentId)?.teacherId;
      setHasChanges(true);
      return newAssignments;
    });
  };

  const handleSaveAssignments = async () => {
    for (const [studentId, teacherId] of Object.entries(assignments)) {
      const student = students.find((s: any) => s.id === parseInt(studentId));
      
      // Only update if the assignment has changed
      if (student && student.teacherId !== teacherId) {
        await saveAssignmentsMutation.mutateAsync({
          studentId: parseInt(studentId),
          teacherId,
        });
      }
    }
    
    toast({
      title: "Assignments saved",
      description: "Student assignments have been successfully updated",
    });
    
    setHasChanges(false);
  };

  const findTeacherName = (teacherId: number) => {
    const teacher = teachers?.find((t: any) => t.id === teacherId);
    return teacher ? teacher.name : "Unassigned";
  };

  // Function to get assigned classes for a teacher
  const getTeacherClasses = (teacher: any) => {
    if (!teacher?.assignedClasses) return [];
    return teacher.assignedClasses;
  };
  
  // Function to check if a teacher can be assigned to a student based on class
  const canAssignTeacher = (student: any, teacher: any) => {
    const teacherClasses = getTeacherClasses(teacher);
    return teacherClasses.includes(student.class);
  };

  return (
    <MainLayout title="Assign Students to Teachers">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Assign Students to Teachers</h2>
        <p className="mt-1 text-sm text-gray-500">Manage student-teacher assignments</p>
      </div>
      
      {/* Filter Controls */}
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="assign-class-filter" className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger id="assign-class-filter">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Classes</SelectItem>
                  <SelectItem value="Nursery">Nursery</SelectItem>
                  <SelectItem value="LKG">LKG</SelectItem>
                  <SelectItem value="UKG">UKG</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="assign-teacher-filter" className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
            <Select value={teacherFilter} onValueChange={setTeacherFilter}>
              <SelectTrigger id="assign-teacher-filter">
                <SelectValue placeholder="Select teacher" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="all">All Teachers</SelectItem>
                  {!loadingTeachers && teachers?.map((teacher: any) => (
                    <SelectItem key={teacher.id} value={teacher.id.toString()}>
                      {teacher.name} ({getTeacherClasses(teacher).join(", ")})
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="assign-search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                id="assign-search"
                type="text"
                placeholder="Student name"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </div>
      
      {(loadingStudents || loadingTeachers) ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-10 w-10 animate-spin text-purple-600" />
        </div>
      ) : (
        <Card className="shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Student Assignments</h3>
          </div>
          
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Teacher</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign To</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student: any) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <Avatar>
                                {student.photoUrl ? (
                                  <AvatarImage src={student.photoUrl} alt={student.name} />
                                ) : null}
                                <AvatarFallback className="bg-purple-100 text-purple-600">
                                  {student.name.substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{student.class}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {student.teacherId ? findTeacherName(student.teacherId) : "Unassigned"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Select 
                            value={assignments[student.id]?.toString() || ""}
                            onValueChange={(value) => handleAssignmentChange(student.id, parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="">Unassigned</SelectItem>
                                {teachers?.map((teacher: any) => (
                                  <SelectItem 
                                    key={teacher.id} 
                                    value={teacher.id.toString()}
                                    disabled={!canAssignTeacher(student, teacher)}
                                  >
                                    {teacher.name} ({getTeacherClasses(teacher).join(", ")})
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No students found matching your filters
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="mt-6 flex justify-end">
        <Button 
          onClick={handleSaveAssignments}
          disabled={!hasChanges || saveAssignmentsMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {saveAssignmentsMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            "Save Assignments"
          )}
        </Button>
      </div>
    </MainLayout>
  );
}
