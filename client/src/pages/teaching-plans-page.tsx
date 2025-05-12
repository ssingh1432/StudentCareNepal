import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { 
  BookOpen, 
  Calendar, 
  Edit, 
  FileText, 
  Plus, 
  Trash2, 
  User
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { TeachingPlan, User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, getPlanTypeColorClass, getClassColorClass, truncateText } from "@/lib/utils";

export default function TeachingPlansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [filters, setFilters] = useState({
    type: "all",
    class: "all",
    search: "",
  });

  // Fetch teaching plans
  const { data: teachingPlans = [], isLoading } = useQuery<TeachingPlan[]>({
    queryKey: ["/api/teaching-plans"],
  });
  
  // Fetch teachers
  const { data: teachers = [] } = useQuery<User[]>({
    queryKey: ["/api/teachers"],
  });

  // Create map of user IDs to names for displaying the creator
  const usersMap: Record<number, string> = {};
  if (user) {
    usersMap[user.id] = user.name;
  }
  teachers.forEach(teacher => {
    usersMap[teacher.id] = teacher.name;
  });

  // Apply filters
  const filteredPlans = teachingPlans.filter(plan => {
    // Filter by type
    if (filters.type !== "all" && plan.type !== filters.type) {
      return false;
    }
    
    // Filter by class
    if (filters.class !== "all" && plan.class !== filters.class) {
      return false;
    }
    
    // Filter by search term (title or description)
    if (filters.search && 
        !plan.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !plan.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  // Function to delete a teaching plan
  const handleDeletePlan = async (planId: number) => {
    if (!confirm("Are you sure you want to delete this teaching plan? This action cannot be undone.")) {
      return;
    }
    
    try {
      await apiRequest("DELETE", `/api/teaching-plans/${planId}`);
      
      // Invalidate the teaching plans query to refresh the data
      queryClient.invalidateQueries({queryKey: ["/api/teaching-plans"]});
      
      toast({
        title: "Success",
        description: "Teaching plan deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete teaching plan",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout title="Teaching Plans">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Teaching Plans</h2>
            <p className="mt-1 text-sm text-gray-500">Create and manage teaching plans for each class</p>
          </div>
          
          <div className="mt-4 md:mt-0 flex-shrink-0">
            <Link href="/teaching-plans/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Plan
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Controls */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="plan-type-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Plan Type
                </label>
                <Select
                  value={filters.type}
                  onValueChange={(value) => setFilters({ ...filters, type: value })}
                >
                  <SelectTrigger id="plan-type-filter">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label htmlFor="plan-class-filter" className="block text-sm font-medium text-gray-700 mb-1">
                  Class
                </label>
                <Select
                  value={filters.class}
                  onValueChange={(value) => setFilters({ ...filters, class: value })}
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
                <label htmlFor="plan-search" className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <Input
                  id="plan-search"
                  type="text"
                  placeholder="Search plans"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teaching Plans Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.length > 0 ? (
            filteredPlans.map(plan => (
              <Card key={plan.id} className="overflow-hidden">
                <div className="px-4 py-5 sm:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge className={getPlanTypeColorClass(plan.type)}>
                      {plan.type}
                    </Badge>
                    <Badge className={getClassColorClass(plan.class)}>
                      {plan.class}
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg leading-6 font-medium text-gray-900">{plan.title}</h3>
                  
                  <div className="mt-2 max-w-xl text-sm text-gray-500 h-24 overflow-hidden">
                    <p>{truncateText(plan.description, 200)}</p>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="mr-1 h-4 w-4 text-gray-400" />
                      <p>{formatDate(plan.startDate)} to {formatDate(plan.endDate)}</p>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <User className="mr-1 h-4 w-4 text-gray-400" />
                      <p>Created by: {usersMap[plan.createdBy] || "Unknown"}</p>
                    </div>
                  </div>
                  
                  <div className="mt-5 flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/teaching-plans/${plan.id}`}>
                        <FileText className="h-4 w-4 mr-1" /> View
                      </Link>
                    </Button>
                    <Button variant="secondary" size="sm" asChild>
                      <Link href={`/teaching-plans/${plan.id}`}>
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Link>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                      onClick={() => handleDeletePlan(plan.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center p-8 bg-white rounded-lg border border-gray-200">
              <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No teaching plans found</h3>
              <p className="text-gray-500 mt-2">
                {filters.type !== "all" || filters.class !== "all" || filters.search
                  ? "Try adjusting your filters or create a new plan."
                  : "Create your first teaching plan to get started."}
              </p>
              <Button className="mt-4" asChild>
                <Link href="/teaching-plans/new">
                  <Plus className="h-4 w-4 mr-2" /> Create New Plan
                </Link>
              </Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
