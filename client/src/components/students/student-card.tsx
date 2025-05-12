import { Student } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PencilLine, Eye, Trash } from "lucide-react";
import { Link } from "wouter";

interface StudentCardProps {
  student: Student;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function StudentCard({ student, onEdit, onDelete }: StudentCardProps) {
  const formatEnumValue = (value: string): string => {
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-purple-50">
        <div>
          <Badge variant={student.classType as any} className="mb-1">
            {student.classType.toUpperCase()}
          </Badge>
          <h3 className="text-lg font-semibold text-gray-900">{student.name}</h3>
        </div>
        <div className="flex">
          {onEdit && (
            <Button variant="ghost" size="icon" onClick={onEdit} title="Edit">
              <PencilLine className="h-4 w-4 text-gray-500" />
            </Button>
          )}
          {onDelete && (
            <Button variant="ghost" size="icon" onClick={onDelete} title="Delete">
              <Trash className="h-4 w-4 text-gray-500" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex">
        <div className="w-1/3 bg-purple-50 flex items-center justify-center p-2">
          {student.photoUrl ? (
            <img
              src={student.photoUrl}
              alt={`${student.name} photo`}
              className="h-24 w-24 rounded-full object-cover border-2 border-white shadow"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-white border-2 border-purple-100 flex items-center justify-center">
              <span className="text-2xl font-semibold text-purple-300">
                {student.name.substring(0, 2).toUpperCase()}
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
              <p className="font-medium">{formatEnumValue(student.learningAbility)}</p>
            </div>
            <div>
              <p className="text-gray-500">Writing Speed</p>
              <p className="font-medium">
                {student.writingSpeed === "not_applicable"
                  ? "N/A"
                  : formatEnumValue(student.writingSpeed)}
              </p>
            </div>
            {student.parentContact && (
              <div>
                <p className="text-gray-500">Parent Contact</p>
                <p className="font-medium">{student.parentContact}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between">
        <Link href={`/progress?studentId=${student.id}`}>
          <Button variant="link" size="sm" className="text-xs text-purple-600 hover:text-purple-500 font-medium p-0">
            <Eye className="h-3 w-3 mr-1" /> View Progress
          </Button>
        </Link>
        <Link href={`/progress/add?studentId=${student.id}`}>
          <Button variant="link" size="sm" className="text-xs text-purple-600 hover:text-purple-500 font-medium p-0">
            <PencilLine className="h-3 w-3 mr-1" /> Add Progress Entry
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
