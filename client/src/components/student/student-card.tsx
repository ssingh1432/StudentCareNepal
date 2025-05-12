import { Student } from "@shared/schema";
import { 
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Edit, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface StudentCardProps {
  student: Student;
  onEdit: () => void;
  onDelete: () => void;
}

export function StudentCard({ student, onEdit, onDelete }: StudentCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-purple-50">
        <div>
          <Badge variant="outline" className="bg-purple-100 text-purple-800">
            {student.class}
          </Badge>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{student.name}</h3>
        </div>
        <div className="flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-gray-500 hover:text-gray-700"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-gray-500 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex">
        <div className="w-1/3 bg-purple-50 flex items-center justify-center p-2">
          <div className="h-24 w-24 rounded-full overflow-hidden bg-white border-2 border-white shadow">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-purple-100">
                <User className="h-12 w-12 text-purple-300" />
              </div>
            )}
          </div>
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
              <p className="text-gray-500">Parent Contact</p>
              <p className="font-medium">{student.parentContact || "None"}</p>
            </div>
          </div>
        </div>
      </div>
      
      <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between">
        <Link href={`/progress?studentId=${student.id}`}>
          <Button
            variant="link"
            size="sm"
            className="text-xs text-purple-600 hover:text-purple-500 p-0"
          >
            View Progress
          </Button>
        </Link>
        <Link href={`/progress?new=true&studentId=${student.id}`}>
          <Button
            variant="link"
            size="sm"
            className="text-xs text-purple-600 hover:text-purple-500 p-0"
          >
            <BarChart2 className="mr-1 h-3 w-3" />
            Add Progress Entry
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
