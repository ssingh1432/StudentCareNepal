import { Card, CardContent } from "@/components/ui/card";
import { Student, TeachingPlan, User, Progress } from "@shared/schema";
import { GraduationCap, Users, BookOpen, BarChart3 } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  description?: string;
  linkHref?: string;
  linkText?: string;
  color?: string;
}

function StatsCard({
  title,
  value,
  icon,
  description,
  linkHref,
  linkText,
  color = "purple",
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 bg-${color}-100 rounded-md p-3`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd className="flex items-baseline">
                <div className="text-2xl font-semibold text-gray-900">{value}</div>
                {description && <p className="ml-2 text-sm text-gray-500">{description}</p>}
              </dd>
            </dl>
          </div>
        </div>
        {linkHref && linkText && (
          <div className="mt-4">
            <a
              href={linkHref}
              className={`text-sm font-medium text-${color}-600 hover:text-${color}-500`}
            >
              {linkText}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface StatsSectionProps {
  students: Student[];
  teachers?: User[];
  teachingPlans?: TeachingPlan[];
  progressEntries?: Progress[];
  showTeachers?: boolean;
}

export function StatsSection({
  students,
  teachers = [],
  teachingPlans = [],
  progressEntries = [],
  showTeachers = true,
}: StatsSectionProps) {
  // Group students by class
  const nurseryStudents = students.filter(s => s.class === "Nursery").length;
  const lkgStudents = students.filter(s => s.class === "LKG").length;
  const ukgStudents = students.filter(s => s.class === "UKG").length;

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Total Students"
        value={students.length}
        icon={<GraduationCap className="h-6 w-6 text-purple-600" />}
        linkHref="/students"
        linkText="View all students"
        color="purple"
      />
      
      {showTeachers && (
        <StatsCard
          title="Teachers"
          value={teachers.length}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          linkHref="/teachers"
          linkText="Manage teachers"
          color="blue"
        />
      )}
      
      <StatsCard
        title="Teaching Plans"
        value={teachingPlans.length}
        icon={<BookOpen className="h-6 w-6 text-green-600" />}
        linkHref="/teaching-plans"
        linkText="View all plans"
        color="green"
      />
      
      <StatsCard
        title="Progress Entries"
        value={progressEntries.length}
        icon={<BarChart3 className="h-6 w-6 text-yellow-600" />}
        linkHref="/progress"
        linkText="View progress"
        color="yellow"
      />
    </div>
  );
}

interface ClassDistributionProps {
  students: Student[];
}

export function ClassDistribution({ students }: ClassDistributionProps) {
  const totalStudents = students.length;
  if (totalStudents === 0) return null;

  const nurseryStudents = students.filter(s => s.class === "Nursery").length;
  const lkgStudents = students.filter(s => s.class === "LKG").length;
  const ukgStudents = students.filter(s => s.class === "UKG").length;

  const nurseryPercentage = Math.round((nurseryStudents / totalStudents) * 100);
  const lkgPercentage = Math.round((lkgStudents / totalStudents) * 100);
  const ukgPercentage = Math.round((ukgStudents / totalStudents) * 100);

  return (
    <Card className="col-span-2">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">Students by Class</h3>
      </div>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-purple-600 mr-2"></div>
                <span className="text-sm font-medium text-gray-700">Nursery</span>
              </div>
              <span className="text-sm text-gray-500">{nurseryStudents} students</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${nurseryPercentage}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                <span className="text-sm font-medium text-gray-700">LKG</span>
              </div>
              <span className="text-sm text-gray-500">{lkgStudents} students</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full"
                style={{ width: `${lkgPercentage}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="text-sm font-medium text-gray-700">UKG</span>
              </div>
              <span className="text-sm text-gray-500">{ukgStudents} students</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${ukgPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
