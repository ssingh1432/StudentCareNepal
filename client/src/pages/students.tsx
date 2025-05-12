import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { StudentList } from "@/components/student/student-list";
import { StudentForm } from "@/components/student/student-form";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { User, Student } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useSearch } from "wouter";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Search, UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function StudentsPage() {
  const { isAdmin } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filters, setFilters] = useState({
    class: "all",
    teacherId: "all",
    learningAbility: "all",
    search: "",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const search = useSearch();
  
  // Parse URL for showing form
  useEffect(() => {
    if (search.includes("new=true")) {
      setShowForm(true);
    }
  }, [search]);

  // Fetch students with filters
  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/protected/students", filters],
    queryFn: async ({ queryKey }) => {
      const [_, filters] = queryKey;
      const { class: classFilter, teacherId, learningAbility } = filters as any;
      
      let url = "/api/protected/students";
      const params = new URLSearchParams();
      
      if (classFilter !== "all") params.append("class", classFilter);
      if (teacherId !== "all") params.append("teacherId", teacherId);
      if (learningAbility !== "all") params.append("learningAbility", learningAbility);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });

  // Fetch teachers for filtering (admin only)
  const { data: teachers } = useQuery<User[]>({
    queryKey: ["/api/admin/teachers"],
    enabled: isAdmin,
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/protected/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/students"] });
      toast({
        title: "Student deleted",
        description: "Student has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete student: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter students by search term
  const filteredStudents = students
    ? students.filter((student) =>
        student.name.toLowerCase().includes(filters.search.toLowerCase())
      )
    : [];

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowForm(true);
  };

  const handleDeleteStudent = (id: number) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      deleteStudentMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedStudent(null);
    // Remove the new parameter if it exists
    if (search.includes("new=true")) {
      setLocation("/students");
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedStudent(null);
    queryClient.invalidateQueries({ queryKey: ["/api/protected/students"] });
  };

  return (
    <MainLayout title="Student Management">
      {!showForm ? (
        <>
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage all students in the pre-primary section
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex-shrink-0">
              <Button 
                onClick={() => setShowForm(true)} 
                className="bg-purple-600 hover:bg-purple-700"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Add Student
              </Button>
            </div>
          </div>

          <Card className="bg-white p-4 shadow rounded-lg mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label htmlFor="class-filter">Class</Label>
                <Select
                  value={filters.class}
                  onValueChange={(value) => setFilters({ ...filters, class: value })}
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
                  value={filters.learningAbility}
                  onValueChange={(value) => setFilters({ ...filters, learningAbility: value })}
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

              {isAdmin && (
                <div>
                  <Label htmlFor="teacher-filter">Teacher</Label>
                  <Select
                    value={filters.teacherId}
                    onValueChange={(value) => setFilters({ ...filters, teacherId: value })}
                  >
                    <SelectTrigger id="teacher-filter">
                      <SelectValue placeholder="All Teachers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Teachers</SelectItem>
                      {teachers?.map((teacher) => (
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
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    id="search-filter"
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

          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <StudentList
              students={filteredStudents}
              onEdit={handleEditStudent}
              onDelete={handleDeleteStudent}
            />
          )}
        </>
      ) : (
        <StudentForm
          student={selectedStudent}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </MainLayout>
  );
}
