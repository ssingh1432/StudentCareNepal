import { Student } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, FileText, PenLine } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface StudentCardProps {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (student: Student) => void;
  onViewProgress: (student: Student) => void;
  onAddProgress: (student: Student) => void;
}

export default function StudentCard({ 
  student, 
  onEdit, 
  onDelete, 
  onViewProgress, 
  onAddProgress 
}: StudentCardProps) {
  // Get teacher name if available
  const { data: teachers = [] } = useQuery({
    queryKey: ["/api/teachers"],
  });
  
  const teacherName = teachers.find((t: any) => t.id === student.teacherId)?.name || "Unassigned";
  
  // Determine background color based on class
  const getBgColor = () => {
    switch (student.class) {
      case "Nursery":
        return "bg-yellow-50";
      case "LKG":
        return "bg-blue-50";
      case "UKG":
        return "bg-green-50";
      default:
        return "bg-gray-50";
    }
  };
  
  // Determine badge color for class
  const getClassBadgeColor = () => {
    switch (student.class) {
      case "Nursery":
        return "bg-yellow-100 text-yellow-800";
      case "LKG":
        return "bg-blue-100 text-blue-800";
      case "UKG":
        return "bg-green-100 text-green-800";
      default:
        return "";
    }
  };
  
  return (
    <Card className="overflow-hidden flex flex-col">
      <div className={`flex justify-between items-center p-4 border-b border-gray-200 ${getBgColor()}`}>
        <div>
          <Badge 
            variant="outline" 
            className={getClassBadgeColor()}
          >
            {student.class}
          </Badge>
          <h3 className="mt-1 text-lg font-semibold text-gray-900">{student.name}</h3>
        </div>
        <div className="flex">
          <Button variant="ghost" size="sm" onClick={() => onEdit(student)}>
            <Edit className="h-4 w-4 text-gray-500" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(student)}>
            <Trash2 className="h-4 w-4 text-gray-500" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex">
        <div className="w-1/3 bg-gray-50 flex items-center justify-center p-2">
          {student.photoUrl ? (
            <img 
              src={student.photoUrl} 
              alt={`${student.name}'s photo`} 
              className="h-24 w-24 rounded-full object-cover border-2 border-white shadow" 
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-purple-100 flex items-center justify-center text-3xl font-medium text-purple-600">
              {student.name.charAt(0)}
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
      
      <CardFooter className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-purple-600 hover:text-purple-500 font-medium"
          onClick={() => onViewProgress(student)}
        >
          <FileText className="h-3.5 w-3.5 mr-1" />
          View Progress
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs text-purple-600 hover:text-purple-500 font-medium"
          onClick={() => onAddProgress(student)}
        >
          <PenLine className="h-3.5 w-3.5 mr-1" />
          Add Progress
        </Button>
      </CardFooter>
    </Card>
  );
}
