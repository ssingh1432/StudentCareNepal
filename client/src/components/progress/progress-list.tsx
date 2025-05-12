import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Eye
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Student,
  ProgressEntry
} from "@shared/schema";

interface ProgressListProps {
  progressEntries: ProgressEntry[];
  students: Student[];
  isLoading: boolean;
  onEdit: (progress: ProgressEntry) => void;
  onRefresh: () => void;
}

export function ProgressList({ progressEntries, students, isLoading, onEdit, onRefresh }: ProgressListProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [progressToDelete, setProgressToDelete] = useState<ProgressEntry | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // Get student name by ID
  const getStudentName = (studentId: number) => {
    const student = students.find((s) => s.id === studentId);
    return student ? student.name : "Unknown";
  };

  // Get student class by ID
  const getStudentClass = (studentId: number) => {
    const student = students.find((s) => s.id === studentId);
    return student ? student.class : "Unknown";
  };

  // Get student photo by ID
  const getStudentPhoto = (studentId: number) => {
    const student = students.find((s) => s.id === studentId);
    return student?.photoUrl || null;
  };

  // Handle progress deletion
  const handleDelete = async (progress: ProgressEntry) => {
    try {
      await apiRequest("DELETE", `/api/progress/${progress.id}`);
      toast({
        title: "Progress Entry Deleted",
        description: "The progress entry has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      onRefresh();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete progress entry",
        variant: "destructive",
      });
    }
  };

  // Get badge color based on progress rating
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "bg-green-100 text-green-800";
      case "Good":
        return "bg-yellow-100 text-yellow-800";
      case "Needs Improvement":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <div className="bg-white shadow rounded-lg overflow-hidden">
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
                Array(5).fill(0).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="ml-3">
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24 float-right" /></TableCell>
                  </TableRow>
                ))
              ) : progressEntries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-6 text-gray-500">
                    No progress entries found. Add a new entry to get started.
                  </TableCell>
                </TableRow>
              ) : (
                progressEntries.map((progress) => (
                  <TableRow key={progress.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          {getStudentPhoto(progress.studentId) ? (
                            <img
                              className="h-8 w-8 rounded-full object-cover"
                              src={getStudentPhoto(progress.studentId) || ""}
                              alt={getStudentName(progress.studentId)}
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-600 font-medium text-xs">
                                {getStudentName(progress.studentId).charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
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
                      {new Date(progress.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRatingColor(progress.socialSkills)}>
                        {progress.socialSkills}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRatingColor(progress.preLiteracy)}>
                        {progress.preLiteracy}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRatingColor(progress.preNumeracy)}>
                        {progress.preNumeracy}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRatingColor(progress.motorSkills)}>
                        {progress.motorSkills}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRatingColor(progress.emotionalDevelopment)}>
                        {progress.emotionalDevelopment}
                      </Badge>
                    </TableCell>
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
                          <DropdownMenuItem onClick={() => onEdit(progress)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => {
                              setProgressToDelete(progress);
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
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this progress entry for {progressToDelete ? getStudentName(progressToDelete.studentId) : "this student"}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                if (progressToDelete) {
                  handleDelete(progressToDelete);
                  setProgressToDelete(null);
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
