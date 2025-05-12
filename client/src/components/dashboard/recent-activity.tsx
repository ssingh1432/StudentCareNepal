import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Student, Progress, TeachingPlan, User } from "@shared/schema";
import { PlusCircle, FileEdit, FileText, UserCircle } from "lucide-react";

interface Activity {
  id: string;
  type: "student_added" | "progress_updated" | "plan_created" | "teacher_added";
  date: Date;
  content: string;
  entityId: number;
  by?: string;
}

// Generate activities from actual data
function generateActivities(
  students: Student[],
  progress: Progress[],
  plans: TeachingPlan[],
  teachers: User[],
  usersMap: Record<number, User>
): Activity[] {
  const activities: Activity[] = [];

  // Add recent students
  students.slice(0, 5).forEach((student) => {
    activities.push({
      id: `student-${student.id}`,
      type: "student_added",
      date: student.createdAt,
      content: `New student ${student.name} added to ${student.class}`,
      entityId: student.id,
      by: student.teacherId ? usersMap[student.teacherId]?.name : undefined,
    });
  });

  // Add recent progress entries
  progress.slice(0, 5).forEach((entry) => {
    const student = students.find((s) => s.id === entry.studentId);
    if (student) {
      activities.push({
        id: `progress-${entry.id}`,
        type: "progress_updated",
        date: entry.date,
        content: `Progress updated for ${student.name} (${student.class})`,
        entityId: entry.id,
        by: entry.createdBy ? usersMap[entry.createdBy]?.name : undefined,
      });
    }
  });

  // Add recent teaching plans
  plans.slice(0, 5).forEach((plan) => {
    activities.push({
      id: `plan-${plan.id}`,
      type: "plan_created",
      date: plan.createdAt,
      content: `New ${plan.type.toLowerCase()} plan created for ${plan.class}: ${plan.title}`,
      entityId: plan.id,
      by: plan.createdBy ? usersMap[plan.createdBy]?.name : undefined,
    });
  });

  // Add recent teachers
  teachers.slice(0, 3).forEach((teacher) => {
    activities.push({
      id: `teacher-${teacher.id}`,
      type: "teacher_added",
      date: teacher.createdAt,
      content: `New teacher ${teacher.name} joined with access to ${teacher.assignedClasses?.join(", ")}`,
      entityId: teacher.id,
    });
  });

  // Sort by date (newest first)
  return activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
}

interface RecentActivityProps {
  students: Student[];
  progress: Progress[];
  plans: TeachingPlan[];
  teachers: User[];
  usersMap: Record<number, User>;
}

export function RecentActivity({
  students,
  progress,
  plans,
  teachers,
  usersMap,
}: RecentActivityProps) {
  const activities = generateActivities(students, progress, plans, teachers, usersMap);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "student_added":
        return <PlusCircle className="h-5 w-5 text-green-600" />;
      case "progress_updated":
        return <FileEdit className="h-5 w-5 text-blue-600" />;
      case "plan_created":
        return <FileText className="h-5 w-5 text-purple-600" />;
      case "teacher_added":
        return <UserCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <Card>
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
      </div>
      <CardContent className="p-4">
        <div className="flow-root">
          {activities.length > 0 ? (
            <ul className="-mb-8">
              {activities.map((activity, index) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {index < activities.length - 1 && (
                      <span
                        className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      ></span>
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <span className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                          {getActivityIcon(activity.type)}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {activity.content}
                            {activity.by && (
                              <span className="font-medium text-gray-900"> by {activity.by}</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={activity.date.toString()}>
                            {formatDate(activity.date)}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-gray-500 py-4">No recent activity</p>
          )}
        </div>
        <div className="mt-6">
          <Button variant="outline" className="w-full">
            View all
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
