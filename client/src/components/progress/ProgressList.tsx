import { useState, useEffect } from "react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";

interface ProgressListProps {
  progressEntries: any[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

export default function ProgressList({ progressEntries, onEdit, onDelete }: ProgressListProps) {
  const [entriesWithStudent, setEntriesWithStudent] = useState<any[]>([]);
  
  // Fetch students to get student data
  const { data: students } = useQuery({
    queryKey: ["/api/students"],
    queryFn: async () => {
      const res = await fetch("/api/students", {
        credentials: "include",
      });
      
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });

  // Combine progress entries with student data
  useEffect(() => {
    if (students && progressEntries.length > 0) {
      const combined = progressEntries.map((entry) => {
        const student = students.find((s: any) => s.id === entry.studentId);
        return {
          ...entry,
          student,
        };
      });
      setEntriesWithStudent(combined);
    } else {
      setEntriesWithStudent([]);
    }
  }, [students, progressEntries]);

  // Function to get rating badge color
  const getRatingColor = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return "bg-green-100 text-green-800";
      case "Good":
        return "bg-yellow-100 text-yellow-800";
      case "Needs Improvement":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Recent Progress Entries</h3>
      </div>
      
      <CardContent className="p-0">
        {entriesWithStudent.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No progress entries found. Record a student's progress to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Social Skills</TableHead>
                  <TableHead>Pre-Literacy</TableHead>
                  <TableHead>Pre-Numeracy</TableHead>
                  <TableHead>Motor Skills</TableHead>
                  <TableHead>Emotional Dev.</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entriesWithStudent.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <Avatar>
                            {entry.student?.photoUrl ? (
                              <AvatarImage src={entry.student.photoUrl} alt={entry.student?.name || "Student"} />
                            ) : null}
                            <AvatarFallback className="bg-purple-100 text-purple-600">
                              {entry.student?.name ? entry.student.name.substring(0, 2).toUpperCase() : "ST"}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{entry.student?.name || "Unknown Student"}</div>
                          <div className="text-sm text-gray-500">{entry.student?.class || ""}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-gray-500">
                      {entry.date ? format(new Date(entry.date), "yyyy-MM-dd") : ""}
                    </TableCell>
                    <TableCell>
                      <Badge className={getRatingColor(entry.socialSkills)}>
                        {entry.socialSkills}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRatingColor(entry.preLiteracy)}>
                        {entry.preLiteracy}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRatingColor(entry.preNumeracy)}>
                        {entry.preNumeracy}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRatingColor(entry.motorSkills)}>
                        {entry.motorSkills}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRatingColor(entry.emotionalDevelopment)}>
                        {entry.emotionalDevelopment}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-sm font-medium">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(entry.id)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(entry.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
