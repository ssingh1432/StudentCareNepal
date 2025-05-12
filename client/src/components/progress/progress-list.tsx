import { Progress } from "@shared/schema";
import { formatDate } from "@/lib/utils";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PencilIcon, Trash2Icon } from "lucide-react";

interface ProgressListProps {
  progress: Progress[];
  onEdit: (progress: Progress) => void;
  onDelete: (progress: Progress) => void;
}

export function ProgressList({ progress, onEdit, onDelete }: ProgressListProps) {
  // Get badge style based on rating
  const getRatingBadge = (rating: string) => {
    switch (rating) {
      case "Excellent":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Excellent</Badge>;
      case "Good":
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Good</Badge>;
      case "Needs Improvement":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Needs Improvement</Badge>;
      default:
        return <Badge variant="outline">{rating}</Badge>;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Progress History</h3>
        <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
          {progress.length} Entries
        </span>
      </div>

      {progress.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-gray-500">No progress entries found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Social Skills</TableHead>
                <TableHead>Pre-Literacy</TableHead>
                <TableHead>Pre-Numeracy</TableHead>
                <TableHead>Motor Skills</TableHead>
                <TableHead>Emotional Dev.</TableHead>
                <TableHead>Comments</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {progress.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">
                    {formatDate(entry.date)}
                  </TableCell>
                  <TableCell>{getRatingBadge(entry.socialSkills)}</TableCell>
                  <TableCell>{getRatingBadge(entry.preLiteracy)}</TableCell>
                  <TableCell>{getRatingBadge(entry.preNumeracy)}</TableCell>
                  <TableCell>{getRatingBadge(entry.motorSkills)}</TableCell>
                  <TableCell>{getRatingBadge(entry.emotionalDevelopment)}</TableCell>
                  <TableCell className="max-w-md truncate">
                    {entry.comments || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onEdit(entry)}
                      className="h-8 w-8 p-0 mr-1"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => onDelete(entry)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2Icon className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
