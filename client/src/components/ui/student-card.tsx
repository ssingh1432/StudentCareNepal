import { Student } from "@/types";
import { Link } from "wouter";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash, BarChart } from "lucide-react";
import { getInitials, getClassColor, getLearningAbilityColor, getWritingSpeedColor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StudentCardProps {
  student: Student;
  onDelete?: (id: number) => void;
}

export function StudentCard({ student, onDelete }: StudentCardProps) {
  const classColor = getClassColor(student.class);
  const abilityColor = getLearningAbilityColor(student.learningAbility);
  const speedColor = getWritingSpeedColor(student.writingSpeed || "N/A");

  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-purple-50">
        <div>
          <Badge variant="outline" className={`bg-${classColor}-100 text-${classColor}-800 hover:bg-${classColor}-100`}>
            {student.class}
          </Badge>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{student.name}</h3>
        </div>
        <div className="flex">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/students/edit/${student.id}`}>
              <Edit className="h-4 w-4" />
            </Link>
          </Button>
          {onDelete && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onDelete(student.id)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 flex">
        <div className="w-1/3 bg-purple-50 flex items-center justify-center p-2">
          {student.photoUrl ? (
            <img 
              src={student.photoUrl} 
              alt={`${student.name}'s photo`} 
              className="h-24 w-24 rounded-full object-cover border-2 border-white shadow"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-purple-200 flex items-center justify-center border-2 border-white shadow">
              <span className="text-2xl font-semibold text-purple-700">
                {getInitials(student.name)}
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
              <p className="font-medium">{student.writingSpeed || "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-500">Teacher</p>
              <p className="font-medium">{student.teacherName || "Unassigned"}</p>
            </div>
          </div>
        </div>
      </div>
      <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between">
        <Button variant="link" size="sm" className="text-purple-600 hover:text-purple-500 p-0" asChild>
          <Link to={`/progress?studentId=${student.id}`}>
            View Progress
          </Link>
        </Button>
        <Button variant="link" size="sm" className="text-purple-600 hover:text-purple-500 p-0" asChild>
          <Link to={`/progress/add/${student.id}`}>
            <BarChart className="h-4 w-4 mr-1" />
            Add Progress
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
