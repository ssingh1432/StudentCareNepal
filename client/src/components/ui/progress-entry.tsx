import { Progress } from "@shared/schema";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface ProgressEntryProps {
  progress: Progress;
  studentName?: string;
  onEdit?: (progress: Progress) => void;
  onDelete?: (progress: Progress) => void;
}

export function ProgressEntry({
  progress,
  studentName,
  onEdit,
  onDelete
}: ProgressEntryProps) {
  const { user } = useAuth();

  // Format date for display
  const formatDate = (dateString: Date | string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get rating badge class
  const getRatingBadgeClass = (rating: string) => {
    switch (rating) {
      case "Excellent": return "badge-excellent";
      case "Good": return "badge-good";
      case "Needs Improvement": return "badge-needs-improvement";
      default: return "";
    }
  };

  return (
    <Card className="overflow-hidden card-hover">
      <CardHeader className="flex justify-between items-center p-4 border-b border-gray-200 bg-primary-50">
        <div className="flex items-center justify-between w-full">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {studentName ? `${studentName} - ` : ""}Progress Entry
            </p>
            <p className="text-xs text-gray-500">{formatDate(progress.date)}</p>
          </div>
          {(user?.role === "admin" || true) && ( // In reality, check if teacher has access
            <div className="flex">
              <Button variant="ghost" size="sm" className="mr-1 h-8 w-8 p-0" onClick={() => onEdit?.(progress)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-destructive h-8 w-8 p-0" onClick={() => onDelete?.(progress)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Social Skills</p>
            <span className={`badge ${getRatingBadgeClass(progress.socialSkills)}`}>
              {progress.socialSkills}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Pre-Literacy</p>
            <span className={`badge ${getRatingBadgeClass(progress.preLiteracy)}`}>
              {progress.preLiteracy}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Pre-Numeracy</p>
            <span className={`badge ${getRatingBadgeClass(progress.preNumeracy)}`}>
              {progress.preNumeracy}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Motor Skills</p>
            <span className={`badge ${getRatingBadgeClass(progress.motorSkills)}`}>
              {progress.motorSkills}
            </span>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Emotional Development</p>
            <span className={`badge ${getRatingBadgeClass(progress.emotionalDevelopment)}`}>
              {progress.emotionalDevelopment}
            </span>
          </div>
        </div>
        
        {progress.comments && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-1">Comments</p>
            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded border border-gray-100">
              {progress.comments}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
