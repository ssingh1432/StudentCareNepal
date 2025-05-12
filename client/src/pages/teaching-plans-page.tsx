import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { TeachingPlan } from "@shared/schema";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle, Search } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { PlanForm } from "@/components/teaching/plan-form";
import { PlanList } from "@/components/teaching/plan-list";

export default function TeachingPlansPage() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<TeachingPlan | null>(null);
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Query teaching plans
  const { data: plans, isLoading, refetch } = useQuery({
    queryKey: ["/api/teaching-plans", typeFilter, classFilter],
    queryFn: async () => {
      let url = "/api/teaching-plans";
      
      // Add filters if they are set
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.append("type", typeFilter);
      if (classFilter !== "all") params.append("class", classFilter);
      
      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch teaching plans");
      
      return res.json();
    },
  });
  
  // Filter plans based on search query
  const filteredPlans = plans ? plans.filter((plan: TeachingPlan) => {
    // Filter by search query (case insensitive)
    if (searchQuery && !plan.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !plan.description.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  }) : [];
  
  // Handle plan creation/update
  const handlePlanSaved = () => {
    refetch();
    setShowPlanForm(false);
    setSelectedPlan(null);
  };
  
  // Handle edit plan
  const handleEditPlan = (plan: TeachingPlan) => {
    setSelectedPlan(plan);
    setShowPlanForm(true);
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Teaching Plans" 
          openMobileSidebar={() => setMobileMenuOpen(true)} 
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Teaching Plans</h2>
              <p className="mt-1 text-sm text-gray-500">Create and manage teaching plans for each class</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex-shrink-0">
              <Dialog open={showPlanForm} onOpenChange={setShowPlanForm}>
                <DialogTrigger asChild>
                  <Button className="inline-flex items-center bg-purple-600 hover:bg-purple-700">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px]">
                  <PlanForm 
                    plan={selectedPlan}
                    onSaved={handlePlanSaved}
                    onCancel={() => {
                      setShowPlanForm(false);
                      setSelectedPlan(null);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Filter Controls */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="plan-type-filter">Plan Type</Label>
                  <Select 
                    value={typeFilter} 
                    onValueChange={setTypeFilter}
                  >
                    <SelectTrigger id="plan-type-filter" className="mt-1">
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
                  <Label htmlFor="plan-class-filter">Class</Label>
                  <Select 
                    value={classFilter} 
                    onValueChange={setClassFilter}
                  >
                    <SelectTrigger id="plan-class-filter" className="mt-1">
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
                  <Label htmlFor="plan-search">Search</Label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-gray-400" />
                    </div>
                    <Input
                      id="plan-search"
                      type="text"
                      placeholder="Search plans"
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Teaching Plans Cards */}
          {isLoading ? (
            <div className="flex justify-center my-12">
              <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            </div>
          ) : (
            <PlanList 
              plans={filteredPlans} 
              onEdit={handleEditPlan}
              onDelete={() => refetch()}
            />
          )}
        </main>
      </div>
    </div>
  );
}
