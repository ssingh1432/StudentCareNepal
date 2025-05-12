import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { ProgressBadge } from '../shared/Badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ProgressListProps {
  studentId: number;
  studentName: string;
  onEditProgress: (progress: any) => void;
  refreshTrigger?: number;
}

const ProgressList: React.FC<ProgressListProps> = ({
  studentId,
  studentName,
  onEditProgress,
  refreshTrigger = 0
}) => {
  const { toast } = useToast();
  const [progressToDelete, setProgressToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch progress entries for the student
  const { data: progressEntries = [], isLoading, isError, refetch } = useQuery({
    queryKey: [`/api/progress?studentId=${studentId}`, refreshTrigger],
    staleTime: 0, // Always fetch fresh data
  });

  const handleDeleteConfirm = async () => {
    if (!progressToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await apiRequest('DELETE', `/api/progress/${progressToDelete.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to delete progress entry');
      }
      
      toast({
        title: 'Progress entry deleted',
        description: `Progress entry for ${studentName} dated ${formatDate(progressToDelete.date)} has been deleted.`,
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting progress entry:', error);
      toast({
        title: 'Failed to delete progress entry',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setProgressToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        <p>Error loading progress entries. Please try again later.</p>
      </div>
    );
  }

  if (progressEntries.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 text-center">
        <p className="text-gray-500">No progress entries found for this student.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-36">Date</TableHead>
              <TableHead>Social Skills</TableHead>
              <TableHead>Pre-Literacy</TableHead>
              <TableHead>Pre-Numeracy</TableHead>
              <TableHead>Motor Skills</TableHead>
              <TableHead>Emotional Dev.</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {progressEntries.map((entry: any) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">
                  {formatDate(entry.date)}
                </TableCell>
                <TableCell>
                  <ProgressBadge rating={entry.socialSkills} />
                </TableCell>
                <TableCell>
                  <ProgressBadge rating={entry.preLiteracy} />
                </TableCell>
                <TableCell>
                  <ProgressBadge rating={entry.preNumeracy} />
                </TableCell>
                <TableCell>
                  <ProgressBadge rating={entry.motorSkills} />
                </TableCell>
                <TableCell>
                  <ProgressBadge rating={entry.emotionalDevelopment} />
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEditProgress(entry)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setProgressToDelete(entry)}
                        className="text-red-600 hover:text-red-700 focus:text-red-700"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      
      {/* Delete confirmation dialog */}
      <AlertDialog 
        open={!!progressToDelete} 
        onOpenChange={() => !isDeleting && setProgressToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Progress Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this progress entry for {studentName} dated {progressToDelete && formatDate(progressToDelete.date)}? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Display comments if any */}
      {progressEntries.some((entry: any) => entry.comments) && (
        <div className="mt-6">
          <h3 className="font-semibold text-gray-900 mb-2">Comments</h3>
          <div className="space-y-3">
            {progressEntries
              .filter((entry: any) => entry.comments)
              .map((entry: any) => (
                <div key={`comment-${entry.id}`} className="bg-gray-50 p-3 rounded-md">
                  <p className="text-xs text-gray-500 mb-1">{formatDate(entry.date)}</p>
                  <p className="text-sm">{entry.comments}</p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressList;
