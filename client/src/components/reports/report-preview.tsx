import { useQuery } from "@tanstack/react-query";
import { Student, Progress } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function ReportPreview() {
  // Fetch a sample of students
  const { data: students, isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ['/api/students'],
  });

  // Get a sample of students for preview (max 3)
  const previewStudents = students?.slice(0, 3);

  const getRatingVariant = (rating: string | undefined): "excellent" | "good" | "needs-improvement" => {
    switch (rating) {
      case "Excellent": return "excellent";
      case "Good": return "good";
      case "Needs Improvement": return "needs-improvement";
      default: return "good";
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Report Preview</h3>
      </div>
      
      <div className="p-6">
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-purple-800">Nepal Central High School</h1>
            <h2 className="text-lg font-medium text-gray-700">Student Progress Report</h2>
            <p className="text-sm text-gray-500">Narephat, Kathmandu</p>
          </div>
          
          <div className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase">Class</h3>
                <p className="mt-1 text-base text-gray-900">All Classes</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 uppercase">Date Range</h3>
                <p className="mt-1 text-base text-gray-900">{new Date().toISOString().split('T')[0]} to {new Date().toISOString().split('T')[0]}</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="bg-gray-50">Student Name</TableHead>
                  <TableHead className="bg-gray-50">Learning Ability</TableHead>
                  <TableHead className="bg-gray-50">Writing Speed</TableHead>
                  <TableHead className="bg-gray-50">Social Skills</TableHead>
                  <TableHead className="bg-gray-50">Pre-Literacy</TableHead>
                  <TableHead className="bg-gray-50">Pre-Numeracy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingStudents ? (
                  // Loading skeletons
                  Array(3).fill(0).map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : previewStudents?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">No student data available for preview</TableCell>
                  </TableRow>
                ) : (
                  previewStudents?.map(student => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>
                        <Badge variant={student.learningAbility === "Talented" ? "excellent" : 
                                      student.learningAbility === "Average" ? "good" : "needs-improvement"}>
                          {student.learningAbility}
                        </Badge>
                      </TableCell>
                      <TableCell>{student.writingSpeed}</TableCell>
                      <TableCell>
                        <Badge variant={getRatingVariant("Good")}>Good</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRatingVariant("Excellent")}>Excellent</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getRatingVariant("Good")}>Good</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-6 text-sm text-gray-500 text-right">
            <p>Generated on: {new Date().toLocaleDateString()}</p>
            <p>System: Pre-Primary Student Record-Keeping System</p>
          </div>
        </div>
      </div>
    </div>
  );
}
