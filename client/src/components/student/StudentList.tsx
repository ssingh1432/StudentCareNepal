import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StudentCard from "@/components/student/StudentCard";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit, Trash2, BarChart } from "lucide-react";
import { Link } from "wouter";
import { useMobileScreen } from "@/hooks/use-mobile";

interface StudentListProps {
  students: any[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function StudentList({ students, onEdit, onDelete }: StudentListProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const isMobile = useMobileScreen();
  
  // If on mobile, default to grid view
  useEffect(() => {
    if (isMobile) {
      setViewMode("grid");
    }
  }, [isMobile]);
  
  // Fetch teachers to get teacher names
  const { data: teachers } = useQuery({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const res = await fetch("/api/teachers", {
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to fetch teachers");
      return res.json();
    },
  });

  // Function to get teacher name by ID
  const getTeacherName = (teacherId?: number) => {
    if (!teacherId || !teachers) return "Unassigned";
    const teacher = teachers.find((t: any) => t.id === teacherId);
    return teacher ? teacher.name : "Unassigned";
  };

  // Function to get learning ability badge color
  const getLearningAbilityColor = (ability: string) => {
    switch (ability) {
      case "Talented":
        return "bg-green-100 text-green-800";
      case "Average":
        return "bg-yellow-100 text-yellow-800";
      case "Slow Learner":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to get writing speed badge color
  const getWritingSpeedColor = (speed: string) => {
    switch (speed) {
      case "Speed Writing":
        return "bg-blue-100 text-blue-800";
      case "Slow Writing":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Function to get class badge color
  const getClassColor = (className: string) => {
    switch (className) {
      case "Nursery":
        return "bg-yellow-100 text-yellow-800";
      case "LKG":
        return "bg-blue-100 text-blue-800";
      case "UKG":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Add teacher names to student objects
  const studentsWithTeacherNames = students.map((student) => ({
    ...student,
    teacherName: getTeacherName(student.teacherId),
  }));

  return (
    <div>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Students</h3>
          <div className="flex items-center gap-4">
            <Badge className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
              {students.length} Total
            </Badge>
            {!isMobile && (
              <div className="flex border rounded-md overflow-hidden">
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("table")}
                >
                  Table
                </Button>
                <Button
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                >
                  Grid
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {students.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No students found. Create a new student to get started.</p>
          </div>
        ) : viewMode === "table" && !isMobile ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Learning Ability</TableHead>
                  <TableHead>Writing Speed</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsWithTeacherNames.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
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
                          <div className="text-sm text-gray-500">
                            {student.parentContact ? `Parent: ${student.parentContact}` : ''}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getClassColor(student.class)}>
                        {student.class}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">{student.age} years</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getLearningAbilityColor(student.learningAbility)}>
                        {student.learningAbility}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getWritingSpeedColor(student.writingSpeed)}>
                        {student.writingSpeed}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">{student.teacherName}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/progress?studentId=${student.id}`}>
                          <a className="text-purple-600 hover:text-purple-900 inline-flex items-center">
                            <BarChart className="h-4 w-4 mr-1" />
                            Progress
                          </a>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(student.id)}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(student.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentsWithTeacherNames.map((student) => (
                <StudentCard
                  key={student.id}
                  student={student}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        )}
        
        {students.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to{" "}
                    <span className="font-medium">{students.length}</span> of{" "}
                    <span className="font-medium">{students.length}</span> results
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
