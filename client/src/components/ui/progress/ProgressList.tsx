import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { ProgressEntry, progressRatings, classLevels } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProgressListProps {
  onEdit: (progressId: number) => void;
  onDelete: (progressId: number) => void;
}

export function ProgressList({ onEdit, onDelete }: ProgressListProps) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [studentFilter, setStudentFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const { data: progressEntries, isLoading: isLoadingProgress } = useQuery<ProgressEntry[]>({
    queryKey: ['/api/progress', { studentFilter, classFilter, dateFilter }],
  });

  const { data: students, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/students/assignedToMe'],
  });

  const handleDeleteConfirm = async (progressId: number) => {
    try {
      await apiRequest("DELETE", `/api/progress/${progressId}`, {});
      toast({
        title: "Success",
        description: "Progress entry has been deleted successfully",
      });
      // The query will be invalidated elsewhere
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete progress entry: ${error}`,
        variant: "destructive",
      });
    }
  };

  const getStudentName = (studentId: number) => {
    if (!students) return "Loading...";
    const student = students.find((s: any) => s.id === studentId);
    return student ? student.name : "Unknown";
  };

  const getStudentClass = (studentId: number) => {
    if (!students) return "Loading...";
    const student = students.find((s: any) => s.id === studentId);
    return student ? student.class : "Unknown";
  };

  const getStudentPhoto = (studentId: number) => {
    if (!students) return null;
    const student = students.find((s: any) => s.id === studentId);
    return student ? student.photoUrl : null;
  };

  const getRatingBadgeClass = (rating: string) => {
    const normalized = rating.replace(/\s+/g, '').toLowerCase();
    return `rating-${normalized}`;
  };

  if (isLoadingProgress || isLoadingStudents) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Progress Entries</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Select
              value={studentFilter}
              onValueChange={setStudentFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by student" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Students</SelectItem>
                {students?.map((student: any) => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
            <input
              type="date"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="rounded-md border">
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
              {progressEntries && progressEntries.length > 0 ? (
                progressEntries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-8 w-8 flex-shrink-0">
                          {getStudentPhoto(entry.studentId) ? (
                            <img
                              src={getStudentPhoto(entry.studentId)!}
                              alt={getStudentName(entry.studentId)}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-600 font-medium">
                                {getStudentName(entry.studentId).charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {getStudentName(entry.studentId)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {getStudentClass(entry.studentId)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(entry.date), "yyyy-MM-dd")}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRatingBadgeClass(entry.socialSkills)}>
                        {entry.socialSkills}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRatingBadgeClass(entry.preLiteracy)}>
                        {entry.preLiteracy}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRatingBadgeClass(entry.preNumeracy)}>
                        {entry.preNumeracy}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRatingBadgeClass(entry.motorSkills)}>
                        {entry.motorSkills}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRatingBadgeClass(entry.emotionalDevelopment)}>
                        {entry.emotionalDevelopment}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="mr-2"
                        onClick={() => onEdit(entry.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => onDelete(entry.id)} 
                        className="text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No progress entries found. Try adjusting your filters or add a new entry.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
