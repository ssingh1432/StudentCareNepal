import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Edit, Trash, Plus, CalendarIcon } from "lucide-react";
import { ProgressEntry, Student } from "@shared/schema";

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
import { ProgressForm } from "@/components/progress/progress-form";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

interface ProgressListProps {
  studentId?: number;
}

export function ProgressList({ studentId }: ProgressListProps) {
  const { toast } = useToast();
  const [addProgressOpen, setAddProgressOpen] = useState(false);
  const [editProgressData, setEditProgressData] = useState<ProgressEntry | null>(null);
  const [deleteProgressId, setDeleteProgressId] = useState<number | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | undefined>(studentId);
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);

  // Fetch students for dropdown
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  // Fetch progress entries for selected student
  const { data: progressEntries = [], isLoading } = useQuery<ProgressEntry[]>({
    queryKey: [`/api/students/${selectedStudentId}/progress`],
    enabled: !!selectedStudentId,
  });

  // Filter by date if dateFilter is set
  const filteredEntries = dateFilter
    ? progressEntries.filter((entry) => {
        const entryDate = new Date(entry.date);
        const filterDate = new Date(dateFilter);
        return (
          entryDate.getDate() === filterDate.getDate() &&
          entryDate.getMonth() === filterDate.getMonth() &&
          entryDate.getFullYear() === filterDate.getFullYear()
        );
      })
    : progressEntries;

  const handleDeleteProgress = async () => {
    if (!deleteProgressId) return;

    try {
      await apiRequest("DELETE", `/api/progress/${deleteProgressId}`);
      
      if (selectedStudentId) {
        queryClient.invalidateQueries({ queryKey: [`/api/students/${selectedStudentId}/progress`] });
      }
      
      toast({
        title: "Progress entry deleted",
        description: "The progress entry has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete progress entry",
        variant: "destructive",
      });
    } finally {
      setDeleteProgressId(null);
    }
  };

  const formatEnumValue = (value: string): string => {
    return value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleStudentChange = (id: string) => {
    setSelectedStudentId(parseInt(id, 10));
    setDateFilter(undefined);
  };

  const columns = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => {
        const date = new Date(row.getValue("date"));
        return format(date, "PPP");
      },
    },
    {
      accessorKey: "socialSkills",
      header: "Social Skills",
      cell: ({ row }) => {
        const value = row.getValue("socialSkills") as string;
        return <Badge variant={value as any}>{formatEnumValue(value)}</Badge>;
      },
    },
    {
      accessorKey: "preLiteracy",
      header: "Pre-Literacy",
      cell: ({ row }) => {
        const value = row.getValue("preLiteracy") as string;
        return <Badge variant={value as any}>{formatEnumValue(value)}</Badge>;
      },
    },
    {
      accessorKey: "preNumeracy",
      header: "Pre-Numeracy",
      cell: ({ row }) => {
        const value = row.getValue("preNumeracy") as string;
        return <Badge variant={value as any}>{formatEnumValue(value)}</Badge>;
      },
    },
    {
      accessorKey: "motorSkills",
      header: "Motor Skills",
      cell: ({ row }) => {
        const value = row.getValue("motorSkills") as string;
        return <Badge variant={value as any}>{formatEnumValue(value)}</Badge>;
      },
    },
    {
      accessorKey: "emotionalDevelopment",
      header: "Emotional Dev.",
      cell: ({ row }) => {
        const value = row.getValue("emotionalDevelopment") as string;
        return <Badge variant={value as any}>{formatEnumValue(value)}</Badge>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const progress = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditProgressData(progress)}
              title="Edit Progress"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setDeleteProgressId(progress.id)}
              title="Delete Progress"
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
      {!studentId && (
        <Select value={selectedStudentId?.toString()} onValueChange={handleStudentChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select student" />
          </SelectTrigger>
          <SelectContent>
            {students.map((student) => (
              <SelectItem key={student.id} value={student.id.toString()}>
                {student.name} ({student.classType.toUpperCase()})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-[200px] justify-start text-left font-normal ${
              !dateFilter && "text-muted-foreground"
            }`}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {dateFilter ? format(dateFilter, "PPP") : "Filter by date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={dateFilter}
            onSelect={setDateFilter}
            initialFocus
          />
          {dateFilter && (
            <div className="p-3 border-t border-gray-100">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDateFilter(undefined)}
                className="w-full"
              >
                Clear Date Filter
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );

  // Selected student details
  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Progress Tracking</h2>
          {selectedStudent && (
            <p className="text-sm text-gray-500">
              Viewing progress for {selectedStudent.name} ({selectedStudent.classType.toUpperCase()})
            </p>
          )}
        </div>
        <Button 
          onClick={() => setAddProgressOpen(true)}
          disabled={!selectedStudentId && !studentId}
        >
          <Plus className="mr-2 h-4 w-4" /> Record Progress
        </Button>
      </div>

      {!selectedStudentId && !studentId ? (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md text-yellow-800">
          Please select a student to view or record progress.
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredEntries}
          filters={filters}
          showSearch={false}
        />
      )}

      {/* Add Progress Dialog */}
      <Dialog open={addProgressOpen} onOpenChange={setAddProgressOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Record Student Progress</DialogTitle>
            <DialogDescription>
              Track the student's development across various skill areas.
            </DialogDescription>
          </DialogHeader>
          <ProgressForm
            studentId={studentId || selectedStudentId}
            onSuccess={() => setAddProgressOpen(false)}
            onCancel={() => setAddProgressOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Progress Dialog */}
      <Dialog
        open={!!editProgressData}
        onOpenChange={(open) => !open && setEditProgressData(null)}
      >
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Edit Progress Entry</DialogTitle>
            <DialogDescription>
              Update the student's progress information.
            </DialogDescription>
          </DialogHeader>
          {editProgressData && (
            <ProgressForm
              initialData={editProgressData}
              isEditMode={true}
              onSuccess={() => setEditProgressData(null)}
              onCancel={() => setEditProgressData(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteProgressId}
        onOpenChange={(open) => !open && setDeleteProgressId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this progress entry.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProgress}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
