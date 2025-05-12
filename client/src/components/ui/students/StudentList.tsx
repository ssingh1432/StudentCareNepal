import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Loader2, Search, Edit, FileText, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Student, classLevels, learningAbilities, writingSpeeds } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface StudentListProps {
  onEdit: (studentId: number) => void;
  onDelete: (studentId: number) => void;
}

export function StudentList({ onEdit, onDelete }: StudentListProps) {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [classFilter, setClassFilter] = useState<string>("all");
  const [abilityFilter, setAbilityFilter] = useState<string>("all");
  const [teacherFilter, setTeacherFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ['/api/students', { classFilter, abilityFilter, teacherFilter, searchQuery }],
  });

  const { data: teachers, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['/api/teachers'],
    enabled: isAdmin, // Only fetch teachers if admin
  });

  const handleDeleteConfirm = async (studentId: number) => {
    try {
      await apiRequest("DELETE", `/api/students/${studentId}`, {});
      toast({
        title: "Success",
        description: "Student has been deleted successfully",
      });
      // The query will be invalidated elsewhere
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to delete student: ${error}`,
        variant: "destructive",
      });
    }
  };

  const getTeacherName = (teacherId: number) => {
    if (!teachers) return "Loading...";
    const teacher = teachers.find((t: any) => t.id === teacherId);
    return teacher ? teacher.name : "Unknown";
  };

  const getLearningAbilityBadgeClass = (ability: string) => {
    const normalized = ability.replace(/\s+/g, '').toLowerCase();
    return `ability-tag-${normalized}`;
  };

  const getWritingSpeedBadgeClass = (speed: string) => {
    const normalized = speed.replace(/\s+/g, '').toLowerCase();
    return `writing-${normalized}`;
  };

  const getClassBadgeClass = (className: string) => {
    const normalized = className.toLowerCase();
    return `class-tag-${normalized}`;
  };

  if (isLoadingStudents || isLoadingTeachers) {
    return (
      <div className="flex justify-center items-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Students</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
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
              value={abilityFilter}
              onValueChange={setAbilityFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by ability" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Abilities</SelectItem>
                {learningAbilities.map((ability) => (
                  <SelectItem key={ability} value={ability}>{ability}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isAdmin && (
            <div>
              <Select
                value={teacherFilter}
                onValueChange={setTeacherFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by teacher" />
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
          )}

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

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Learning Ability</TableHead>
                <TableHead>Writing Speed</TableHead>
                {isAdmin && <TableHead>Teacher</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students && students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {student.photoUrl ? (
                            <img
                              src={student.photoUrl}
                              alt={student.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                              <span className="text-purple-600 font-medium">
                                {student.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.name}</div>
                          {student.parentContact && (
                            <div className="text-sm text-gray-500">
                              Contact: {student.parentContact}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getClassBadgeClass(student.class)}>
                        {student.class}
                      </Badge>
                    </TableCell>
                    <TableCell>{student.age} years</TableCell>
                    <TableCell>
                      <Badge className={getLearningAbilityBadgeClass(student.learningAbility)}>
                        {student.learningAbility}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getWritingSpeedBadgeClass(student.writingSpeed)}>
                        {student.writingSpeed}
                      </Badge>
                    </TableCell>
                    {isAdmin && (
                      <TableCell>{getTeacherName(student.teacherId)}</TableCell>
                    )}
                    <TableCell className="text-right space-x-2">
                      <Link href={`/progress-tracking?studentId=${student.id}`}>
                        <Button variant="outline" size="sm" className="mr-2" title="View Progress">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mr-2"
                        onClick={() => onEdit(student.id)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onDelete(student.id)} 
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-8">
                    No students found. Try adjusting your filters or add a new student.
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
