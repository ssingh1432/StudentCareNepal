import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBgColor?: string;
  iconColor?: string;
  link?: {
    href: string;
    label: string;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  iconBgColor = "bg-purple-100",
  iconColor = "text-purple-600",
  link,
  className,
}: StatCardProps) {
  return (
    <div className={cn("bg-white overflow-hidden shadow rounded-lg", className)}>
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", iconBgColor)}>
            <div className={iconColor}>{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dt className="text-sm font-medium text-gray-500 truncate">
              {title}
            </dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">
                {value}
              </div>
            </dd>
          </div>
        </div>
      </div>
      {link && (
        <div className="bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <a href={link.href} className="font-medium text-purple-600 hover:text-purple-500">
              {link.label}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
