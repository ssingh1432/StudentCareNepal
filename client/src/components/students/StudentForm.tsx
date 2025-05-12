import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Student, studentValidationSchema, InsertStudent, classOptions, learningAbilityOptions } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import PhotoUpload from "./PhotoUpload";
import { useAuth } from "@/hooks/use-auth";

interface StudentFormProps {
  student: Student | null;
  onClose: () => void;
}

const StudentForm = ({ student, onClose }: StudentFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  
  const form = useForm<InsertStudent>({
    resolver: zodResolver(studentValidationSchema),
    defaultValues: {
      name: "",
      age: 3,
      class: "nursery",
      parentContact: "",
      learningAbility: "average",
      writingSpeed: null,
      notes: "",
      photoUrl: "",
      photoPublicId: "",
      teacherId: 0,
    },
  });
  
  // Load teachers for assignment
  const { data: teachers } = useQuery<any[]>({
    queryKey: ["/api/teachers"],
    queryFn: async () => {
      const response = await fetch("/api/teachers", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch teachers");
      }
      
      return response.json();
    },
  });
  
  // Set form values when editing an existing student
  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name,
        age: student.age,
        class: student.class,
        parentContact: student.parentContact || "",
        learningAbility: student.learningAbility,
        writingSpeed: student.writingSpeed,
        notes: student.notes || "",
        photoUrl: student.photoUrl || "",
        photoPublicId: student.photoPublicId || "",
        teacherId: student.teacherId,
      });
    } else {
      form.reset({
        name: "",
        age: 3,
        class: "nursery",
        parentContact: "",
        learningAbility: "average",
        writingSpeed: null,
        notes: "",
        photoUrl: "",
        photoPublicId: "",
        teacherId: 0,
      });
    }
  }, [student, form]);
  
  // Create or update student mutation
  const mutation = useMutation({
    mutationFn: async (data: InsertStudent) => {
      if (student) {
        // Update existing student
        await apiRequest("PUT", `/api/students/${student.id}`, data);
      } else {
        // Create new student
        await apiRequest("POST", "/api/students", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: student ? "Student updated" : "Student created",
        description: student
          ? `${form.getValues("name")} has been updated successfully.`
          : `${form.getValues("name")} has been added successfully.`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: student ? "Failed to update student" : "Failed to create student",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handlePhotoChange = (url: string, publicId: string) => {
    form.setValue("photoUrl", url);
    form.setValue("photoPublicId", publicId);
  };
  
  const onSubmit = (data: InsertStudent) => {
    // If not specified, set teacherId to current user's ID for teachers
    if (!data.teacherId && !isAdmin && user) {
      data.teacherId = user.id;
    }
    
    // For nursery students, ensure writing speed is null
    if (data.class === "nursery") {
      data.writingSpeed = null;
    }
    
    mutation.mutate(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter student name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={3} 
                    max={5} 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="class"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Class</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {classOptions.map((classOption) => (
                      <SelectItem key={classOption} value={classOption}>
                        {classOption.toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="parentContact"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Parent Contact (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter parent contact" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="learningAbility"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Learning Ability</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select learning ability" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {learningAbilityOptions.map((ability) => (
                      <SelectItem key={ability} value={ability}>
                        {ability.charAt(0).toUpperCase() + ability.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="writingSpeed"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Writing Speed {form.watch("class") === "nursery" && "(N/A for Nursery)"}</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value || "na"}
                  value={field.value || "na"}
                  disabled={form.watch("class") === "nursery"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select writing speed" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="slow-writing">Slow Writing</SelectItem>
                    <SelectItem value="speed-writing">Speed Writing</SelectItem>
                    <SelectItem value="na">Not Applicable</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {isAdmin && (
            <FormField
              control={form.control}
              name="teacherId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign Teacher</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value?.toString() || ""}
                    value={field.value?.toString() || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teachers?.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name} ({teacher.assignedClasses?.join(", ")})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any additional notes about the student"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="sm:col-span-2">
            <FormLabel>Student Photo</FormLabel>
            <PhotoUpload
              initialImageUrl={form.watch("photoUrl")}
              initialPublicId={form.watch("photoPublicId")}
              onPhotoChange={handlePhotoChange}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {student ? "Update Student" : "Add Student"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default StudentForm;
