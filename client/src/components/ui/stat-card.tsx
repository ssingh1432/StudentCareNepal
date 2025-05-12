import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  colorClass?: string;
  linkText?: string;
  linkHref?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  colorClass = "bg-purple-100 text-purple-600",
  linkText,
  linkHref
}: StatCardProps) {
  const iconColorClass = cn(colorClass);
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 rounded-md p-3 ${iconColorClass}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                <dd className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">{value}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        {linkText && linkHref && (
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <a
                href={linkHref}
                className="font-medium text-purple-600 hover:text-purple-500"
              >
                {linkText}
              </a>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
