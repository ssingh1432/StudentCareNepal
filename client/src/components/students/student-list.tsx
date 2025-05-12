import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit, Trash, Filter, PlusCircle } from "lucide-react";
import { Student } from "@shared/schema";

import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentForm } from "@/components/students/student-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export function StudentList() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [addStudentOpen, setAddStudentOpen] = useState(false);
  const [editStudentData, setEditStudentData] = useState<Student | null>(null);
  const [deleteStudentId, setDeleteStudentId] = useState<number | null>(null);
  const [classFilter, setClassFilter] = useState<string>("all");
  const [abilityFilter, setAbilityFilter] = useState<string>("all");

  const queryParams = new URLSearchParams();
  if (classFilter !== "all") {
    queryParams.append("classType", classFilter);
  }
  if (abilityFilter !== "all") {
    queryParams.append("learningAbility", abilityFilter);
  }

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: [`/api/students?${queryParams.toString()}`],
  });

  const handleDeleteStudent = async () => {
    if (!deleteStudentId) return;

    try {
      await apiRequest("DELETE", `/api/students/${deleteStudentId}`);
      
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      
      toast({
        title: "Student deleted",
        description: "The student has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete student",
        variant: "destructive",
      });
    } finally {
      setDeleteStudentId(null);
    }
  };

  const formatEnumValue = (value: string): string => {
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const columns = [
    {
      accessorKey: "name",
      header: "Student",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center">
            <div className="flex-shrink-0 h-10 w-10">
              {student.photoUrl ? (
                <img
                  className="h-10 w-10 rounded-full object-cover"
                  src={student.photoUrl}
                  alt={student.name}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <span className="text-purple-600 font-medium">
                    {student.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="ml-4">
              <div className="text-sm font-medium text-gray-900">
                {student.name}
              </div>
              <div className="text-sm text-gray-500">
                {student.parentContact && `Parent: ${student.parentContact}`}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "classType",
      header: "Class",
      cell: ({ row }) => {
        const classType = row.getValue("classType") as string;
        return <Badge variant={classType as any}>{classType.toUpperCase()}</Badge>;
      },
    },
    {
      accessorKey: "age",
      header: "Age",
      cell: ({ row }) => {
        const age = row.getValue("age") as number;
        return <span>{age} years</span>;
      },
    },
    {
      accessorKey: "learningAbility",
      header: "Learning Ability",
      cell: ({ row }) => {
        const ability = row.getValue("learningAbility") as string;
        return <Badge variant={ability as any}>{formatEnumValue(ability)}</Badge>;
      },
    },
    {
      accessorKey: "writingSpeed",
      header: "Writing Speed",
      cell: ({ row }) => {
        const speed = row.getValue("writingSpeed") as string;
        if (speed === "not_applicable") {
          return <span className="text-gray-500">N/A</span>;
        }
        return <Badge variant={speed === "speed_writing" ? "excellent" : "needs_improvement"}>{formatEnumValue(speed)}</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const student = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditStudentData(student)}
              title="Edit Student"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteStudentId(student.id)}
              title="Delete Student"
            >
              <Trash className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        );
      },
    },
  ];

  // Custom filter component for the data table
  const filters = (
    <div className="flex flex-wrap gap-2">
      <Select value={classFilter} onValueChange={setClassFilter}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Class" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Classes</SelectItem>
          <SelectItem value="nursery">Nursery</SelectItem>
          <SelectItem value="lkg">LKG</SelectItem>
          <SelectItem value="ukg">UKG</SelectItem>
        </SelectContent>
      </Select>

      <Select value={abilityFilter} onValueChange={setAbilityFilter}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Learning Ability" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Abilities</SelectItem>
          <SelectItem value="talented">Talented</SelectItem>
          <SelectItem value="average">Average</SelectItem>
          <SelectItem value="slow_learner">Slow Learner</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Students</h2>
        <Button onClick={() => setAddStudentOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Student
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={students}
        searchKey="name"
        filters={filters}
      />

      {/* Add Student Dialog */}
      <Dialog open={addStudentOpen} onOpenChange={setAddStudentOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Create a new student record with all relevant information.
            </DialogDescription>
          </DialogHeader>
          <StudentForm
            onSuccess={() => setAddStudentOpen(false)}
            onCancel={() => setAddStudentOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog
        open={!!editStudentData}
        onOpenChange={(open) => !open && setEditStudentData(null)}
      >
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information and details.
            </DialogDescription>
          </DialogHeader>
          {editStudentData && (
            <StudentForm
              initialData={editStudentData}
              isEditMode={true}
              onSuccess={() => setEditStudentData(null)}
              onCancel={() => setEditStudentData(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteStudentId}
        onOpenChange={(open) => !open && setDeleteStudentId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the student record and all associated progress entries.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteStudent}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
