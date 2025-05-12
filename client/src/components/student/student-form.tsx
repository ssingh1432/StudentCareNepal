import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { studentValidationSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PhotoUpload } from "@/components/ui/photo-upload";
import { useToast } from "@/hooks/use-toast";

type StudentFormValues = z.infer<typeof studentValidationSchema>;

interface StudentFormProps {
  defaultValues?: Partial<StudentFormValues>;
  onSubmit: (data: StudentFormValues) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  teachers?: { id: number; name: string; }[];
}

export function StudentForm({ 
  defaultValues,
  onSubmit,
  onCancel,
  isSubmitting,
  teachers = []
}: StudentFormProps) {
  const { toast } = useToast();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentValidationSchema),
    defaultValues: {
      name: "",
      age: 3,
      class: "Nursery",
      parentContact: "",
      learningAbility: "Average",
      writingSpeed: "N/A",
      notes: "",
      photoUrl: "",
      teacherId: 0,
      ...defaultValues,
    },
  });

  const handleSubmit = (data: StudentFormValues) => {
    // Add the photo file to the form data
    const formData = {
      ...data,
      photo: photoFile,
    };
    onSubmit(formData);
  };

  const handlePhotoChange = (file: File | null) => {
    setPhotoFile(file);
  };

  // Get selected class to conditionally render writing speed field
  const selectedClass = form.watch("class");
  const showWritingSpeed = selectedClass !== "Nursery";

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{defaultValues?.id ? "Edit Student" : "Add New Student"}</CardTitle>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/4">
                <PhotoUpload 
                  initialPhotoUrl={defaultValues?.photoUrl} 
                  onPhotoChange={handlePhotoChange}
                  studentName={form.watch("name")}
                />
              </div>
              
              <div className="md:w-3/4 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Student full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            onChange={e => field.onChange(parseInt(e.target.value))}
                          />
                        </FormControl>
                        <FormDescription>
                          Between 3-5 years
                        </FormDescription>
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
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Nursery">Nursery</SelectItem>
                            <SelectItem value="LKG">LKG</SelectItem>
                            <SelectItem value="UKG">UKG</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="parentContact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Contact (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="learningAbility"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Learning Ability</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select ability" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Talented">Talented</SelectItem>
                            <SelectItem value="Average">Average</SelectItem>
                            <SelectItem value="Slow Learner">Slow Learner</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {showWritingSpeed && (
                    <FormField
                      control={form.control}
                      name="writingSpeed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Writing Speed</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select writing speed" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Speed Writing">Speed Writing</SelectItem>
                              <SelectItem value="Slow Writing">Slow Writing</SelectItem>
                              <SelectItem value="N/A">Not Applicable</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
                
                {teachers.length > 0 && (
                  <FormField
                    control={form.control}
                    name="teacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign Teacher</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          defaultValue={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select teacher" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {teachers.map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                {teacher.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Any additional information about the student" 
                          rows={3}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-purple-600 hover:bg-purple-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : defaultValues?.id ? "Update Student" : "Add Student"}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
