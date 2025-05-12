import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useParams, useLocation } from "wouter";
import { ArrowLeft, Edit, Trash, UserCog, Plus, File } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ProgressBadge from "@/components/ui/ProgressBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [tab, setTab] = useState<string>("details");

  // Fetch student details
  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: [`/api/students/${id}`],
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/students/${id}`, { signal });
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Student not found");
        }
        throw new Error("Failed to fetch student details");
      }
      return response.json();
    },
  });

  // Fetch student progress history
  const { data: progressHistory, isLoading: loadingProgress } = useQuery({
    queryKey: [`/api/students/${id}/progress`],
    queryFn: async ({ signal }) => {
      const response = await fetch(`/api/students/${id}/progress`, { signal });
      if (!response.ok) throw new Error("Failed to fetch progress history");
      return response.json();
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/students/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Student deleted",
        description: "The student has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      navigate("/students");
    },
    onError: (error) => {
      toast({
        title: "Failed to delete student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete progress entry mutation
  const deleteProgressMutation = useMutation({
    mutationFn: async (progressId: number) => {
      await apiRequest("DELETE", `/api/progress/${progressId}`);
    },
    onSuccess: () => {
      toast({
        title: "Progress entry deleted",
        description: "The progress entry has been removed successfully",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/students/${id}/progress`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete progress entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteStudent = () => {
    if (window.confirm(`Are you sure you want to delete ${student?.name}?`)) {
      deleteStudentMutation.mutate();
    }
  };

  const handleDeleteProgress = (progressId: number) => {
    if (window.confirm("Are you sure you want to delete this progress entry?")) {
      deleteProgressMutation.mutate(progressId);
    }
  };

  const getClassBadgeClass = (className: string) => {
    switch (className?.toLowerCase()) {
      case 'nursery': return 'class-badge-nursery';
      case 'lkg': return 'class-badge-lkg';
      case 'ukg': return 'class-badge-ukg';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAbilityBadgeClass = (ability: string) => {
    switch (ability?.toLowerCase()) {
      case 'talented': return 'ability-badge-talented';
      case 'average': return 'ability-badge-average';
      case 'slow learner': return 'ability-badge-slow-learner';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loadingStudent) {
    return (
      <DashboardLayout title="Student Details">
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          <p className="mt-2 text-gray-500">Loading student details...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!student) {
    return (
      <DashboardLayout title="Student Not Found">
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Student not found</h3>
          <p className="mt-1 text-sm text-gray-500">The student you're looking for doesn't exist or has been removed.</p>
          <div className="mt-6">
            <Link href="/students">
              <Button>
                <ArrowLeft className="-ml-1 mr-2 h-5 w-5" />
                Back to Students
              </Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={student.name}>
      <div className="mb-6 flex items-center justify-between">
        <Link href="/students">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Students
          </Button>
        </Link>
        
        <div className="space-x-2">
          <Link href={`/progress/add/${id}`}>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="mr-2 h-5 w-5" />
              Add Progress
            </Button>
          </Link>
          <Link href={`/students/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-5 w-5" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" onClick={handleDeleteStudent} className="text-red-600 hover:bg-red-50 hover:text-red-700">
            <Trash className="mr-2 h-5 w-5" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="details">Student Details</TabsTrigger>
          <TabsTrigger value="progress">Progress History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Student Profile Card */}
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <Avatar className="h-32 w-32">
                  <AvatarImage src={student.photoUrl} alt={student.name} />
                  <AvatarFallback className="text-2xl bg-purple-100 text-purple-600">
                    {student.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <h2 className="mt-4 text-xl font-bold">{student.name}</h2>
                <div className="mt-2 space-x-2">
                  <Badge variant="outline" className={getClassBadgeClass(student.class)}>
                    {student.class}
                  </Badge>
                  <Badge variant="outline" className={getAbilityBadgeClass(student.learningAbility)}>
                    {student.learningAbility}
                  </Badge>
                </div>
                
                <div className="w-full mt-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Age:</span>
                    <span className="font-medium">{student.age} years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Writing Speed:</span>
                    <span className="font-medium">{student.writingSpeed || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Teacher:</span>
                    <span className="font-medium">{student.teacherName}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Student Details Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Parent/Guardian Name</h3>
                    <p className="mt-1 text-gray-900">{student.parentName || "Not provided"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Contact</h3>
                    <p className="mt-1 text-gray-900">{student.parentContact || "Not provided"}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Notes</h3>
                    <p className="mt-1 text-gray-900">{student.notes || "No notes available"}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4">
                <div className="flex items-center space-x-2">
                  <UserCog className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-500">Added on {new Date(student.createdAt).toLocaleDateString()}</span>
                </div>
              </CardFooter>
            </Card>
            
            {/* Most Recent Progress */}
            {progressHistory && progressHistory.length > 0 && (
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Most Recent Progress</CardTitle>
                  <CardDescription>
                    Recorded on {new Date(progressHistory[0].date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <h3 className="text-sm font-medium text-gray-500">Social Skills</h3>
                      <ProgressBadge level={progressHistory[0].socialSkills} className="mt-2" />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <h3 className="text-sm font-medium text-gray-500">Pre-Literacy</h3>
                      <ProgressBadge level={progressHistory[0].preLiteracy} className="mt-2" />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <h3 className="text-sm font-medium text-gray-500">Pre-Numeracy</h3>
                      <ProgressBadge level={progressHistory[0].preNumeracy} className="mt-2" />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <h3 className="text-sm font-medium text-gray-500">Motor Skills</h3>
                      <ProgressBadge level={progressHistory[0].motorSkills} className="mt-2" />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <h3 className="text-sm font-medium text-gray-500">Emotional Dev.</h3>
                      <ProgressBadge level={progressHistory[0].emotionalDevelopment} className="mt-2" />
                    </div>
                  </div>
                  
                  {progressHistory[0].comments && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-500">Comments</h3>
                      <p className="mt-1 text-gray-700">{progressHistory[0].comments}</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="border-t pt-4">
                  <Link href={`/progress/add/${id}`}>
                    <Button>
                      <Plus className="mr-2 h-5 w-5" />
                      Add New Progress Entry
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Progress History</CardTitle>
                <Link href={`/progress/add/${id}`}>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="mr-2 h-5 w-5" />
                    Add Progress
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {loadingProgress ? (
                <div className="text-center py-10">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <p className="mt-2 text-gray-500">Loading progress history...</p>
                </div>
              ) : progressHistory?.length === 0 ? (
                <div className="text-center py-10">
                  <File className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No progress entries</h3>
                  <p className="mt-1 text-sm text-gray-500">Get started by adding the first progress entry.</p>
                  <div className="mt-6">
                    <Link href={`/progress/add/${id}`}>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        <Plus className="mr-2 h-5 w-5" />
                        Add Progress
                      </Button>
                    </Link>
                  </div>
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
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {progressHistory?.map((entry: any) => (
                        <TableRow key={entry.id}>
                          <TableCell className="font-medium">
                            {new Date(entry.date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <ProgressBadge level={entry.socialSkills} />
                          </TableCell>
                          <TableCell>
                            <ProgressBadge level={entry.preLiteracy} />
                          </TableCell>
                          <TableCell>
                            <ProgressBadge level={entry.preNumeracy} />
                          </TableCell>
                          <TableCell>
                            <ProgressBadge level={entry.motorSkills} />
                          </TableCell>
                          <TableCell>
                            <ProgressBadge level={entry.emotionalDevelopment} />
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Link href={`/progress/${entry.id}/edit`}>
                                <Button size="sm" variant="ghost">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => handleDeleteProgress(entry.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
