import { useState } from "react";
import { Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { User, TeachingPlan } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { deleteTeachingPlan } from "@/lib/api";
import { formatDateReadable, truncateText } from "@/lib/utils";
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
import { PlusCircle, BookOpen, Trash, Edit, Filter, FileText, Calendar } from "lucide-react";
import { CLASSES, PLAN_TYPES } from "@shared/schema";

interface TeachingPlansProps {
  user: User;
}

export default function TeachingPlans({ user }: TeachingPlansProps) {
  const { toast } = useToast();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [planToDelete, setPlanToDelete] = useState<number | null>(null);
  const isAdmin = user.role === "admin";

  // Build query string
  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (typeFilter !== "all") params.append("type", typeFilter);
    if (classFilter !== "all") params.append("class", classFilter);
    if (searchQuery) params.append("search", searchQuery);
    return params.toString();
  };

  // Fetch teaching plans
  const {
    data: plans,
    isLoading,
    isError,
    refetch,
  } = useQuery<TeachingPlan[]>({
    queryKey: [`/api/plans?${buildQueryString()}`],
  });

  // Delete teaching plan mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTeachingPlan,
    onSuccess: () => {
      toast({
        title: "Teaching plan deleted",
        description: "Teaching plan has been deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete teaching plan: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    },
  });

  // Handle delete confirmation
  const handleDeleteClick = (id: number) => {
    setPlanToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (planToDelete) {
      deleteMutation.mutate(planToDelete);
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teaching Plans</h1>
            <p className="mt-1 text-sm text-gray-500">Create and manage teaching plans for each class</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex-shrink-0">
            <Button asChild>
              <Link to="/plans/add">
                <PlusCircle className="-ml-1 mr-2 h-5 w-5" />
                Create Plan
              </Link>
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filter Plans</CardTitle>
            <CardDescription>
              Use these filters to find specific teaching plans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {PLAN_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {CLASSES.map((className) => (
                      <SelectItem key={className} value={className}>
                        {className}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search plans..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teaching Plan Cards */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <Skeleton className="h-6 w-40 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                  <div className="mt-4 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </CardContent>
                <CardFooter>
                  <div className="flex justify-between w-full">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-red-500">Failed to load teaching plans</p>
              <Button variant="outline" className="mt-4" onClick={() => refetch()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        ) : plans && plans.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <Card key={plan.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between mb-2">
                    <StatusBadge status={plan.type} type="planType" />
                    <StatusBadge status={plan.class} type="class" />
                  </div>
                  <CardTitle className="text-lg">{plan.title}</CardTitle>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDateReadable(plan.startDate)} to {formatDateReadable(plan.endDate)}
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <p className="text-sm text-gray-600 mb-4 h-20 overflow-hidden">
                    {truncateText(plan.description, 120)}
                  </p>
                  <div className="text-xs text-gray-500 flex items-center">
                    <span>Created by: {plan.teacherName}</span>
                  </div>
                </CardContent>
                <CardFooter className="pt-0 flex justify-between">
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <FileText className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/plans/edit/${plan.id}`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDeleteClick(plan.id)}
                  >
                    <Trash className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-10 text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">No teaching plans found</p>
              {(typeFilter !== "all" || classFilter !== "all" || searchQuery) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setTypeFilter("all");
                    setClassFilter("all");
                    setSearchQuery("");
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Clear Filters
                </Button>
              )}
              <div className="mt-4">
                <Button asChild>
                  <Link to="/plans/add">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New Plan
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              teaching plan from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
