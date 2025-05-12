import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2 } from "lucide-react";
import { Student } from "@shared/schema";

interface StudentCardProps {
  student: Student;
  teacherName: string;
  onEdit: () => void;
  onDelete: () => void;
}

export function StudentCard({ student, teacherName, onEdit, onDelete }: StudentCardProps) {
  const getClassBadgeClass = (className: string) => {
    const normalized = className.toLowerCase();
    return `class-tag-${normalized}`;
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-purple-50">
        <div>
          <Badge className={getClassBadgeClass(student.class)}>
            {student.class}
          </Badge>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{student.name}</h3>
        </div>
        <div className="flex">
          <Button variant="ghost" size="sm" onClick={onEdit} className="mr-1">
            <Edit className="h-4 w-4 text-gray-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex">
        <div className="w-1/3 bg-purple-50 flex items-center justify-center p-2">
          {student.photoUrl ? (
            <img 
              src={student.photoUrl} 
              alt={student.name} 
              className="h-24 w-24 rounded-full object-cover border-2 border-white shadow" 
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center border-2 border-white shadow">
              <span className="text-2xl font-bold text-purple-600">
                {student.name.charAt(0)}
              </span>
            </div>
          )}
        </div>
        <div className="w-2/3 p-4">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-500">Age</p>
              <p className="font-medium">{student.age} years</p>
            </div>
            <div>
              <p className="text-gray-500">Learning Ability</p>
              <p className="font-medium">{student.learningAbility}</p>
            </div>
            <div>
              <p className="text-gray-500">Writing Speed</p>
              <p className="font-medium">{student.writingSpeed}</p>
            </div>
            <div>
              <p className="text-gray-500">Teacher</p>
              <p className="font-medium">{teacherName}</p>
            </div>
          </div>
        </div>
      </div>
      
      <CardFooter className="bg-gray-50 border-t border-gray-200 flex justify-between p-3">
        <Link href={`/progress-tracking?studentId=${student.id}`}>
          <Button variant="link" className="text-purple-600 hover:text-purple-500 text-xs p-0">
            View Progress
          </Button>
        </Link>
        <Link href={`/progress-tracking?action=add&studentId=${student.id}`}>
          <Button variant="link" className="text-purple-600 hover:text-purple-500 text-xs p-0">
            Add Progress Entry
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
