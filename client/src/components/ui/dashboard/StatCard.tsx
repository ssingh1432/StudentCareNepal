import { Card, CardContent } from "@/components/ui/card";
import { ReactNode } from "react";
import { Link } from "wouter";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  bgColor: string;
  iconColor: string;
  href?: string;
  linkText?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  bgColor, 
  iconColor, 
  href, 
  linkText 
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${bgColor} rounded-md p-3`}>
              <div className={`${iconColor}`}>{icon}</div>
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
        {href && linkText && (
          <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="text-sm">
              <Link href={href} className="font-medium text-purple-600 hover:text-purple-500">
                {linkText}
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
