import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Progress, Student } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { ProgressForm } from "./progress-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Search, 
  ClipboardList, 
  Edit, 
  Trash2, 
  Calendar,
  PlusCircle 
} from "lucide-react";

export function ProgressList() {
  const { toast } = useToast();
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showAddProgressForm, setShowAddProgressForm] = useState(false);
  const [editingProgress, setEditingProgress] = useState<(Progress & { id: number }) | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [progressToDelete, setProgressToDelete] = useState<number | null>(null);
  
  // Fetch students for filtering
  const { data: students } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });
  
  // Fetch progress entries
  const { data: progressEntries, isLoading } = useQuery<Progress[]>({
    queryKey: [
      '/api/progress',
      studentFilter !== "all" ? parseInt(studentFilter) : undefined,
      classFilter !== "all" ? classFilter : undefined,
    ],
  });
  
  // Delete progress mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/progress/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/progress'] });
      toast({
        title: "Progress Entry Deleted",
        description: "The progress entry has been removed successfully.",
      });
      setDeleteConfirmOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Filter progress entries
  const filteredProgress = progressEntries?.filter(progress => {
    if (dateFilter && new Date(progress.date).toISOString().split('T')[0] !== dateFilter) {
      return false;
    }
    
    if (searchTerm) {
      const student = students?.find(s => s.id === progress.studentId);
      if (!student || !student.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
    }
    
    return true;
  });
  
  // Function to get student name by ID
  const getStudentName = (studentId: number): string => {
    const student = students?.find(s => s.id === studentId);
    return student ? student.name : "Unknown Student";
  };
  
  // Function to get student class by ID
  const getStudentClass = (studentId: number): string => {
    const student = students?.find(s => s.id === studentId);
    return student ? student.class : "";
  };
  
  // Function to get badge variant based on rating
  const getRatingVariant = (rating: string): "excellent" | "good" | "needs-improvement" => {
    switch (rating) {
      case "Excellent": return "excellent";
      case "Good": return "good";
      case "Needs Improvement": return "needs-improvement";
      default: return "good";
    }
  };
  
  const handleEditProgress = (progress: Progress & { id: number }) => {
    setEditingProgress(progress);
  };
  
  const handleDeleteProgress = (id: number) => {
    setProgressToDelete(id);
    setDeleteConfirmOpen(true);
  };
  
  const confirmDelete = () => {
    if (progressToDelete) {
      deleteMutation.mutate(progressToDelete);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Progress Tracking</h2>
        <Button onClick={() => setShowAddProgressForm(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Record Progress
        </Button>
      </div>
      
      {/* Filter controls */}
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="student-filter" className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <Select 
              value={studentFilter} 
              onValueChange={setStudentFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Students" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {students?.map(student => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.name} ({student.class})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="class-filter-progress" className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <Select 
              value={classFilter} 
              onValueChange={setClassFilter}
            >
              <SelectTrigger>
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
            <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <div className="relative">
              <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                id="date-filter"
                type="date" 
                className="pl-8"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
          
          <div className="sm:col-span-3">
            <label htmlFor="search-filter" className="block text-sm font-medium text-gray-700 mb-1">Search by Student Name</label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                id="search-filter"
                placeholder="Search by student name" 
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Progress Entries Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Progress Entries</h3>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Social Skills</TableHead>
                <TableHead>Pre-Literacy</TableHead>
                <TableHead>Pre-Numeracy</TableHead>
                <TableHead>Motor Skills</TableHead>
                <TableHead>Emotional Dev.</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <ClipboardList className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
                    <p className="mt-2 text-gray-500">Loading progress entries...</p>
                  </TableCell>
                </TableRow>
              ) : filteredProgress?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-gray-500">No progress entries found matching the filters.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProgress?.map(progress => (
                  <TableRow key={progress.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                          <span className="text-purple-600 font-medium">
                            {getStudentName(progress.studentId).charAt(0)}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {getStudentName(progress.studentId)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getStudentClass(progress.studentId)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {progress.date ? format(new Date(progress.date), "yyyy-MM-dd") : "N/A"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRatingVariant(progress.socialSkills)}>
                        {progress.socialSkills}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRatingVariant(progress.preLiteracy)}>
                        {progress.preLiteracy}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRatingVariant(progress.preNumeracy)}>
                        {progress.preNumeracy}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRatingVariant(progress.motorSkills)}>
                        {progress.motorSkills}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getRatingVariant(progress.emotionalDevelopment)}>
                        {progress.emotionalDevelopment}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-indigo-600 hover:text-indigo-900"
                        onClick={() => handleEditProgress(progress as Progress & { id: number })}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-900 ml-2"
                        onClick={() => handleDeleteProgress(progress.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Add progress form */}
      {showAddProgressForm && (
        <ProgressForm 
          open={showAddProgressForm} 
          onClose={() => setShowAddProgressForm(false)} 
        />
      )}
      
      {/* Edit progress form */}
      {editingProgress && (
        <ProgressForm 
          open={!!editingProgress} 
          onClose={() => setEditingProgress(null)} 
          editingProgress={editingProgress}
        />
      )}
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Progress Entry</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this progress entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
