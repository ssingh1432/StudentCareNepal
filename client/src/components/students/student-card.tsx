import { useState } from "react";
import { Student } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Edit, Trash2, User, ClipboardList, PlusCircle } from "lucide-react";

interface StudentCardProps {
  student: Student;
  onEdit: () => void;
}

export function StudentCard({ student, onEdit }: StudentCardProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      toast({
        title: "Student Deleted",
        description: "Student has been removed from the system.",
      });
      setDeleteConfirmOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleDelete = () => {
    deleteMutation.mutate(student.id);
  };
  
  const getClassVariant = (className: string) => {
    switch(className) {
      case "Nursery": return "nursery";
      case "LKG": return "lkg";
      case "UKG": return "ukg";
      default: return "default";
    }
  };
  
  const getAbilityVariant = (ability: string) => {
    switch(ability) {
      case "Talented": return "talented";
      case "Average": return "average";
      case "Slow Learner": return "slow-learner";
      default: return "default";
    }
  };
  
  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-purple-50">
          <div>
            <Badge variant={getClassVariant(student.class)}>
              {student.class}
            </Badge>
            <h3 className="mt-1 text-lg font-semibold text-gray-900">{student.name}</h3>
          </div>
          <div className="flex">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <Edit className="h-4 w-4 text-gray-500" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmOpen(true)}>
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
              <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-12 w-12 text-gray-400" />
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
                <Badge variant={getAbilityVariant(student.learningAbility)}>
                  {student.learningAbility}
                </Badge>
              </div>
              <div>
                <p className="text-gray-500">Writing Speed</p>
                <p className="font-medium">{student.writingSpeed}</p>
              </div>
              
              {student.teacherId && (
                <div>
                  <p className="text-gray-500">Teacher</p>
                  <p className="font-medium">
                    {student.teacherId === user?.id ? "You" : "Assigned"}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 flex justify-between">
          <Link href={`/progress?studentId=${student.id}`}>
            <Button variant="link" size="sm" className="text-xs text-purple-600 hover:text-purple-500 p-0">
              <ClipboardList className="h-3 w-3 mr-1" />
              View Progress
            </Button>
          </Link>
          
          <Link href={`/progress/new?studentId=${student.id}`}>
            <Button variant="link" size="sm" className="text-xs text-purple-600 hover:text-purple-500 p-0">
              <PlusCircle className="h-3 w-3 mr-1" />
              Add Progress Entry
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {student.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
