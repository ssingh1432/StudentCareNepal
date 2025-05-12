import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BarChartHorizontal, Edit, Trash2, Plus, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Student, Progress, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatCloudinaryUrl, formatDate, getRatingColorClass } from "@/lib/utils";

export default function ProgressPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    student: "all",
    class: "all",
    date: "",
  });

  // Fetch students
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Fetch progress entries for all students
  const { data: progressEntries = [], isLoading } = useQuery<Progress[]>({
    queryKey: ['/api/progress/all'],
  });

  // Create map of student IDs to student objects for quick lookup
  const studentsMap: Record<number, Student> = {};
  students.forEach(student => {
    studentsMap[student.id] = student;
  });

  // Apply filters
  const filteredProgress = progressEntries.filter(entry => {
    const student = studentsMap[entry.studentId];
    if (!student) return false;
    
    // Filter by student
    if (filters.student !== "all" && entry.studentId !== parseInt(filters.student)) {
      return false;
    }
    
    // Filter by class
    if (filters.class !== "all" && student.class !== filters.class) {
      return false;
    }
    
    // Filter by date
    if (filters.date && new Date(entry.date).toISOString().split('T')[0] !== filters.date) {
      return false;
    }
    
    return true;
  });

  // Function to delete a progress entry
  const handleDeleteProgress = async (progressId: number) => {
    if (!confirm("Are you sure you want to delete this progress entry? This action cannot be undone.")) {
      return;
    }
    
    try {
      await apiRequest("DELETE", `/api/progress/${progressId}`);
      
      // Invalidate the progress query to refresh the data
      queryClient.invalidateQueries({queryKey: ['/api/progress/all']});
      
      toast({
        title: "Success",
        description: "Progress entry deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete progress entry",
        variant: "destructive",
      });
    }
  };

  // Table columns definition
  const columns = [
    {
      header: "Student",
      accessorKey: "studentId",
      cell: (progress: Progress) => {
        const student = studentsMap[progress.studentId];
        if (!student) return "Unknown Student";
        
        return (
          <div className="flex items-center">
            <Avatar className="h-8 w-8 mr-3">
              <AvatarImage 
                src={student.photoUrl ? formatCloudinaryUrl(student.photoUrl, { width: 40, height: 40 }) : undefined} 
                alt={student.name} 
              />
              <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium text-gray-900">{student.name}</div>
              <div className="text-xs text-gray-500">{student.class}</div>
            </div>
          </div>
        );
      },
    },
    {
      header: "Date",
      accessorKey: "date",
      cell: (progress: Progress) => (
        <div className="flex items-center">
          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
          <span>{formatDate(progress.date)}</span>
        </div>
      ),
    },
    {
      header: "Social Skills",
      accessorKey: "socialSkills",
      cell: (progress: Progress) => (
        <Badge className={getRatingColorClass(progress.socialSkills)}>
          {progress.socialSkills}
        </Badge>
      ),
    },
    {
      header: "Pre-Literacy",
      accessorKey: "preLiteracy",
      cell: (progress: Progress) => (
        <Badge className={getRatingColorClass(progress.preLiteracy)}>
          {progress.preLiteracy}
        </Badge>
      ),
    },
    {
      header: "Pre-Numeracy",
      accessorKey: "preNumeracy",
      cell: (progress: Progress) => (
        <Badge className={getRatingColorClass(progress.preNumeracy)}>
          {progress.preNumeracy}
        </Badge>
      ),
    },
    {
      header: "Motor Skills",
      accessorKey: "motorSkills",
      cell: (progress: Progress) => (
        <Badge className={getRatingColorClass(progress.motorSkills)}>
          {progress.motorSkills}
        </Badge>
      ),
    },
    {
      header: "Emotional Dev.",
      accessorKey: "emotionalDev",
      cell: (progress: Progress) => (
        <Badge className={getRatingColorClass(progress.emotionalDev)}>
          {progress.emotionalDev}
        </Badge>
      ),
    },
    {
      header: "Actions",
      accessorKey: "id",
      cell: (progress: Progress) => (
        <div className="flex justify-end space-x-2">
          <Link href={`/progress/${progress.id}`}>
            <Button variant="ghost" size="sm">
              <Edit className="h-4 w-4 mr-1" />
              <span className="sr-only md:not-sr-only md:ml-1">Edit</span>
            </Button>
          </Link>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-red-600 hover:text-red-800 hover:bg-red-50"
            onClick={() => handleDeleteProgress(progress.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            <span className="sr-only md:not-sr-only md:ml-1">Delete</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AppLayout title="Progress Tracking">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Progress Tracking</h2>
            <p className="mt-1 text-sm text-gray-500">Monitor and record student development</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex-shrink-0">
            <Link href="/progress/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Record Progress
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="student-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Student
                </label>
                <Select
                  value={filters.student}
                  onValueChange={(value) => setFilters({ ...filters, student: value })}
                >
                  <SelectTrigger id="student-filter">
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id.toString()}>
                        {student.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="class-filter-progress" className="block text-sm font-medium text-gray-700 mb-1">
                  Class
                </label>
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
                <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <Input
                  id="date-filter"
                  type="date"
                  value={filters.date}
                  onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Entries List */}
        <Card>
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Progress Entries</h3>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {filteredProgress.length} Total
            </Badge>
          </div>
          
          <div className="px-4 py-4">
            <DataTable
              data={filteredProgress}
              columns={columns}
              searchKeys={["studentId"]}
            />
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
