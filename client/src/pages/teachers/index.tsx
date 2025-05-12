import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PlusIcon,
  SearchIcon,
  PencilIcon,
  TrashIcon,
  KeyIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { AvatarWithPlaceholder } from "@/components/ui/avatar-with-placeholder";
import { StatusBadge } from "@/components/ui/status-badge";
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

export default function TeachersList() {
  const [, navigate] = useLocation();
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [teacherToDelete, setTeacherToDelete] = useState<number | null>(null);

  // Redirect non-admin users
  if (!isAdmin) {
    navigate("/");
    return null;
  }

  // Fetch teachers
  const { data: teachers, isLoading } = useQuery({
    queryKey: ["/api/teachers"],
  });

  // Filter teachers by search query
  const filteredTeachers = teachers
    ? teachers.filter((teacher: any) =>
        teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Handle teacher deletion
  const handleDeleteTeacher = async () => {
    if (!teacherToDelete) return;
    
    // Prevent admin from deleting themselves
    if (teacherToDelete === user?.id) {
      toast({
        title: "Cannot delete yourself",
        description: "You cannot delete your own account",
        variant: "destructive",
      });
      setTeacherToDelete(null);
      return;
    }

    try {
      await apiRequest("DELETE", `/api/teachers/${teacherToDelete}`);
      await queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      
      toast({
        title: "Teacher deleted",
        description: "Teacher has been successfully deleted",
      });
      
      setTeacherToDelete(null);
    } catch (error) {
      console.error("Failed to delete teacher:", error);
      toast({
        title: "Error",
        description: "Failed to delete teacher",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Teacher Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Add, edit, and delete teacher accounts
          </p>
        </div>

        <div className="mt-4 md:mt-0 flex-shrink-0">
          <Link href="/teachers/add">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Teacher
            </Button>
          </Link>
        </div>
      </div>

      {/* Search Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              placeholder="Search teachers by name or email"
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Teachers List */}
      <Card>
        <CardHeader className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <CardTitle className="text-lg font-medium text-gray-900">
            Teachers
          </CardTitle>
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
            {isLoading ? "..." : filteredTeachers.length} Total
          </span>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned Classes
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Students
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="ml-4">
                              <Skeleton className="h-4 w-24" />
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-4 w-32" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <Skeleton className="h-4 w-24 ml-auto" />
                        </td>
                      </tr>
                    ))
                ) : filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher: any) => (
                    <tr key={teacher.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <AvatarWithPlaceholder
                            alt={teacher.name}
                            fallbackText={teacher.name.charAt(0)}
                            className="h-10 w-10"
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {teacher.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {teacher.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {teacher.classes && teacher.classes.length > 0 ? (
                            teacher.classes.map((classLevel: string) => (
                              <StatusBadge
                                key={classLevel}
                                type="class"
                                value={classLevel}
                              />
                            ))
                          ) : (
                            <span className="text-sm text-gray-500">
                              No classes assigned
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {/* In a real app, this would show the actual student count */}
                        {Math.floor(Math.random() * 30)} students
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/teachers/${teacher.id}/edit`}>
                          <Button
                            variant="link"
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="link"
                          className="text-yellow-600 hover:text-yellow-900 mr-3"
                          disabled={teacher.id === user?.id}
                          onClick={() => {
                            toast({
                              title: "Password Reset",
                              description: "Feature not implemented in this demo",
                            });
                          }}
                        >
                          <KeyIcon className="h-4 w-4 mr-1" />
                          Reset Password
                        </Button>
                        <Button
                          variant="link"
                          className="text-red-600 hover:text-red-900"
                          disabled={teacher.id === user?.id}
                          onClick={() => setTeacherToDelete(teacher.id)}
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No teachers found. Try adjusting your search or{" "}
                      <Link href="/teachers/add" className="text-purple-600 hover:text-purple-900">
                        add a new teacher
                      </Link>
                      .
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={teacherToDelete !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setTeacherToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this teacher? This action cannot be undone.
              Students assigned to this teacher will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteTeacher}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
