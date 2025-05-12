import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
import { MoreVertical, Pencil, Trash2, Eye, FileText, Loader2 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { PlanTypeBadge, ClassBadge } from '../shared/Badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PlanListProps {
  onEditPlan: (plan: any) => void;
  onViewPlan: (plan: any) => void;
  refreshTrigger?: number;
}

const PlanList: React.FC<PlanListProps> = ({ 
  onEditPlan,
  onViewPlan,
  refreshTrigger = 0
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  // State for filtering and deleting
  const [planTypeFilter, setPlanTypeFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [planToDelete, setPlanToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch teaching plans
  const { data: plans = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/plans', refreshTrigger],
    staleTime: 0, // Always fetch fresh data
  });

  // Filter plans
  const filteredPlans = plans.filter((plan: any) => {
    // Filter by plan type
    if (planTypeFilter !== 'all' && plan.type !== planTypeFilter) {
      return false;
    }
    
    // Filter by class
    if (classFilter !== 'all' && plan.class !== classFilter) {
      return false;
    }
    
    // Filter by search term
    if (searchTerm && !plan.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await apiRequest('DELETE', `/api/plans/${planToDelete.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to delete teaching plan');
      }
      
      toast({
        title: 'Teaching plan deleted',
        description: `${planToDelete.title} has been deleted successfully.`,
      });
      
      refetch();
    } catch (error) {
      console.error('Error deleting teaching plan:', error);
      toast({
        title: 'Failed to delete teaching plan',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setPlanToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative">
        <p>Error loading teaching plans. Please try again later.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter controls */}
      <div className="bg-white p-4 shadow rounded-lg mb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="plan-type-filter" className="block text-sm font-medium text-gray-700 mb-1">Plan Type</label>
            <Select
              value={planTypeFilter}
              onValueChange={setPlanTypeFilter}
            >
              <SelectTrigger id="plan-type-filter">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="plan-class-filter" className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <Select
              value={classFilter}
              onValueChange={setClassFilter}
            >
              <SelectTrigger id="plan-class-filter">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                <SelectItem value="Nursery">Nursery</SelectItem>
                <SelectItem value="LKG">LKG</SelectItem>
                <SelectItem value="UKG">UKG</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label htmlFor="plan-search" className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Input
                type="text"
                id="plan-search"
                placeholder="Search by title"
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Teaching plans grid */}
      {filteredPlans.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlans.map((plan: any) => (
            <Card key={plan.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between mb-1">
                  <PlanTypeBadge type={plan.type} />
                  <ClassBadge className={plan.class} />
                </div>
                <CardTitle className="text-lg">{plan.title}</CardTitle>
                <div className="flex justify-between">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onViewPlan(plan)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEditPlan(plan)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setPlanToDelete(plan)}
                        className="text-red-600 hover:text-red-700 focus:text-red-700"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 line-clamp-3 mb-4">{plan.description}</p>
                <div className="text-xs text-gray-500">
                  <div className="flex items-center mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {formatDate(plan.startDate)} to {formatDate(plan.endDate)}
                    </span>
                  </div>
                  {plan.creatorName && (
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span>Created by: {plan.creatorName}</span>
                    </div>
                  )}
                </div>
              </CardContent>
              <CardFooter className="bg-gray-50 border-t pt-3">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-purple-600"
                  onClick={() => onViewPlan(plan)}
                >
                  <FileText className="h-4 w-4 mr-1" />
                  View Full Plan
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-500">No teaching plans found matching the selected filters.</p>
        </div>
      )}
      
      {/* Delete confirmation dialog */}
      <AlertDialog 
        open={!!planToDelete} 
        onOpenChange={() => !isDeleting && setPlanToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Teaching Plan</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {planToDelete?.title}? This action cannot be undone.
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
    </div>
  );
};

export default PlanList;
