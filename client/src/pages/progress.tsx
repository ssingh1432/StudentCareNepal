import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { ProgressList } from "@/components/progress/progress-list";
import { ProgressForm } from "@/components/progress/progress-form";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Student, Progress } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useSearch } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { BarChart2, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function ProgressPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState<Progress | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [filters, setFilters] = useState({
    studentId: "all",
    class: "all",
    date: "",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const search = useSearch();

  // Parse URL for showing form
  useEffect(() => {
    if (search.includes("new=true")) {
      setShowForm(true);
    }
  }, [search]);

  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/protected/students"],
  });

  // Fetch progress entries with student info
  const { data: progressEntries, isLoading: isLoadingProgress } = useQuery<Progress[]>({
    queryKey: ["/api/protected/progress"],
    queryFn: async () => {
      if (!students) return [];
      
      const allProgress = [];
      
      // For each student, fetch their progress
      for (const student of students) {
        const res = await fetch(`/api/protected/students/${student.id}/progress`, {
          credentials: "include",
        });
        
        if (res.ok) {
          const studentProgress = await res.json();
          allProgress.push(...studentProgress);
        }
      }
      
      return allProgress;
    },
    enabled: !!students,
  });

  // Delete progress mutation
  const deleteProgressMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/protected/progress/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/protected/progress"] });
      toast({
        title: "Progress deleted",
        description: "Progress entry has been successfully deleted",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete progress entry: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Filter progress entries
  const filteredProgress = progressEntries ? progressEntries
    .filter((progress) => {
      const student = students?.find(s => s.id === progress.studentId);
      
      // Filter by student ID
      if (filters.studentId !== "all" && progress.studentId.toString() !== filters.studentId) {
        return false;
      }
      
      // Filter by class
      if (filters.class !== "all" && student?.class !== filters.class) {
        return false;
      }
      
      // Filter by date
      if (filters.date && new Date(progress.date).toLocaleDateString() !== new Date(filters.date).toLocaleDateString()) {
        return false;
      }
      
      return true;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  const handleEditProgress = (progress: Progress) => {
    setSelectedProgress(progress);
    const student = students?.find(s => s.id === progress.studentId) || null;
    setSelectedStudent(student);
    setShowForm(true);
  };

  const handleNewProgress = (student?: Student) => {
    setSelectedProgress(null);
    setSelectedStudent(student || null);
    setShowForm(true);
  };

  const handleDeleteProgress = (id: number) => {
    if (window.confirm("Are you sure you want to delete this progress entry?")) {
      deleteProgressMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedProgress(null);
    setSelectedStudent(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedProgress(null);
    setSelectedStudent(null);
    queryClient.invalidateQueries({ queryKey: ["/api/protected/progress"] });
  };

  return (
    <MainLayout title="Progress Tracking">
      {!showForm ? (
        <>
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Progress Tracking</h2>
              <p className="mt-1 text-sm text-gray-500">
                Monitor and record student development
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex-shrink-0">
              <Button 
                onClick={() => handleNewProgress()} 
                className="bg-purple-600 hover:bg-purple-700"
              >
                <BarChart2 className="mr-2 h-4 w-4" />
                Record Progress
              </Button>
            </div>
          </div>

          <Card className="bg-white p-4 shadow rounded-lg mb-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="student-filter">Student</Label>
                <Select
                  value={filters.studentId}
                  onValueChange={(value) => setFilters({ ...filters, studentId: value })}
                >
                  <SelectTrigger id="student-filter">
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {students?.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.name} ({student.class})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="class-filter-progress">Class</Label>
                <Select
                  value={filters.class}
                  onValueChange={(value) => setFilters({ ...filters, class: value })}
                >
                  <SelectTrigger id="class-filter-progress">
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
                <Label htmlFor="date-filter">Date</Label>
                <Input
                  id="date-filter"
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                />
              </div>
            </div>
          </Card>

          {isLoadingStudents || isLoadingProgress ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <ProgressList
              progressEntries={filteredProgress}
              students={students || []}
              onEdit={handleEditProgress}
              onDelete={handleDeleteProgress}
              onRecordProgress={handleNewProgress}
            />
          )}
        </>
      ) : (
        <ProgressForm
          progressEntry={selectedProgress}
          preSelectedStudent={selectedStudent}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </MainLayout>
  );
}
