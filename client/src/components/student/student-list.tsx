import { Student } from "@shared/schema";
import { Link } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Edit, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { StudentCard } from "./student-card";
import { useAuth } from "@/hooks/use-auth";

interface StudentListProps {
  students: Student[];
  onEdit: (student: Student) => void;
  onDelete: (id: number) => void;
}

export function StudentList({ students, onEdit, onDelete }: StudentListProps) {
  const { isAdmin } = useAuth();

  // Check if we're on mobile
  const isMobile = window.innerWidth < 768;

  if (students.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-10">
          <User className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
          <p className="text-gray-500 mb-4">There are no students matching your filters</p>
          <Button onClick={() => onEdit({} as Student)} className="bg-purple-600 hover:bg-purple-700">
            Add Your First Student
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render card view for mobile devices
  if (isMobile) {
    return (
      <div className="grid grid-cols-1 gap-6">
        {students.map((student) => (
          <StudentCard 
            key={student.id} 
            student={student} 
            onEdit={() => onEdit(student)} 
            onDelete={() => onDelete(student.id)}
          />
        ))}
      </div>
    );
  }

  // Table view for larger screens
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Students</CardTitle>
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            {students.length} Total
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
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
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden bg-purple-100">
                        {student.photoUrl ? (
                          <img
                            src={student.photoUrl}
                            alt={student.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <User className="h-5 w-5 text-purple-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                        <div className="text-sm text-gray-500">
                          {student.parentContact ? `Parent: ${student.parentContact}` : "No parent contact"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell>{student.age} years</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        student.learningAbility === "Talented"
                          ? "bg-green-100 text-green-800"
                          : student.learningAbility === "Average"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {student.learningAbility}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        student.writingSpeed === "Speed Writing"
                          ? "bg-blue-100 text-blue-800"
                          : student.writingSpeed === "Slow Writing"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {student.writingSpeed}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      {student.teacherName || "Unassigned"}
                    </TableCell>
                  )}
                  <TableCell className="text-right space-x-2">
                    <Link href={`/progress?studentId=${student.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-purple-600 hover:text-purple-900 hover:bg-purple-50"
                      >
                        <BarChart2 className="h-4 w-4" />
                        <span className="sr-only">Progress</span>
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(student)}
                      className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50"
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(student.id)}
                      className="text-red-600 hover:text-red-900 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
