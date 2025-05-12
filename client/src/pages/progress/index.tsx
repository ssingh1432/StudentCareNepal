import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { User, ProgressEntry, Student } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { deleteProgressEntry } from "@/lib/api";
import { formatDateReadable } from "@/lib/utils";
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
import { PlusCircle, BarChart2, Trash, Edit, Filter } from "lucide-react";
import { CLASSES } from "@shared/schema";

interface ProgressTrackingProps {
  user: User;
}

export default function ProgressTracking({ user }: ProgressTrackingProps) {
  const [, navigate] = useLocation();
  const location = useLocation()[0];
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const initialStudentId = urlParams.get("studentId");

  const { toast } = useToast();
  const [studentFilter, setStudentFilter] = useState<string>(initialStudentId || "all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [entryToDelete, setEntryToDelete] = useState<number | null>(null);

  // Build query string
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (studentFilter !== "all") params.append("studentId", studentFilter);
    if (classFilter !== "all") params.append("class", classFilter);
    if (dateFilter) params.append("date", dateFilter);
    return params.toString();
  };

  // Fetch progress entries
  const {
    data: progressEntries,
    isLoading: isLoadingEntries,
    isError: isErrorEntries,
    refetch: refetchEntries,
  } = useQuery<ProgressEntry[]>({
    queryKey: [`/api/progress?${buildQueryString()}`],
  });

  // Fetch students
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Delete progress entry mutation
  const deleteMutation = useMutation({
    mutationFn: deleteProgressEntry,
    onSuccess: () => {
      toast({
        title: "Progress entry deleted",
        description: "Progress entry has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/progress"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete progress entry: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Handle delete confirmation
  const handleDeleteClick = (id: number) => {
    setEntryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (entryToDelete) {
      deleteMutation.mutate(entryToDelete);
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
            <p className="mt-1 text-sm text-gray-500">Monitor and record student development</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex-shrink-0">
            <Button asChild>
              <Link to="/progress/add">
                <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                Record Progress
              </Link>
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filter Progress Entries</CardTitle>
            <CardDescription>
              Use these filters to find specific progress records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="student-filter" className="block text-sm font-medium text-gray-700">Student</label>
                <Select value={studentFilter} onValueChange={setStudentFilter}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    {isLoadingStudents ? (
                      <SelectItem value="loading" disabled>
                        Loading students...
                      </SelectItem>
                    ) : (
                      students?.map((student) => (
                        <SelectItem key={student.id} value={String(student.id)}>
                          {student.name} ({student.class})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="class-filter" className="block text-sm font-medium text-gray-700">Class</label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="mt-1">
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
                <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700">Date</label>
                <Input
                  type="date"
                  className="mt-1"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress entries table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Progress Entries</span>
              {progressEntries && progressEntries.length > 0 && (
                <span className="text-sm font-normal bg-purple-100 text-purple-800 py-1 px-3 rounded-full">
                  {progressEntries.length} {progressEntries.length === 1 ? "entry" : "entries"}
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingEntries ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : isErrorEntries ? (
              <div className="text-center py-10">
                <p className="text-red-500 mb-2">Failed to load progress entries</p>
                <Button variant="outline" onClick={() => refetchEntries()}>
                  Retry
                </Button>
              </div>
            ) : progressEntries && progressEntries.length > 0 ? (
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
                    {progressEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center space-x-2">
                            {entry.studentPhotoUrl ? (
                              <img
                                src={entry.studentPhotoUrl}
                                alt={entry.studentName}
                                className="h-8 w-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <span className="text-xs font-medium text-purple-700">
                                  {entry.studentName?.split(" ").map(n => n[0]).join("")}
                                </span>
                              </div>
                            )}
                            <div>
                              <div>{entry.studentName}</div>
                              <div className="text-xs text-gray-500">{entry.studentClass}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDateReadable(entry.date)}</TableCell>
                        <TableCell>
                          <StatusBadge 
                            status={entry.socialSkills} 
                            type="progressRating" 
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge 
                            status={entry.preLiteracy} 
                            type="progressRating" 
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge 
                            status={entry.preNumeracy} 
                            type="progressRating" 
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge 
                            status={entry.motorSkills} 
                            type="progressRating" 
                          />
                        </TableCell>
                        <TableCell>
                          <StatusBadge 
                            status={entry.emotionalDevelopment} 
                            type="progressRating" 
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleDeleteClick(entry.id)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10">
                <BarChart2 className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">No progress entries found</p>
                {(studentFilter !== "all" || classFilter !== "all" || dateFilter) && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setStudentFilter("all");
                      setClassFilter("all");
                      setDateFilter("");
                    }}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    Clear Filters
                  </Button>
                )}
                <div className="mt-4">
                  <Button asChild>
                    <Link to="/progress/add">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Record Progress
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              progress entry from the database.
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
