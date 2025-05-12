import { ReactNode } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "wouter";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color: string;
  link?: string;
  linkText?: string;
}

export default function StatCard({ 
  title, 
  value, 
  icon, 
  color, 
  link, 
  linkText = "View all" 
}: StatCardProps) {
  const colorClasses = {
    purple: "bg-purple-100 text-purple-600",
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    red: "bg-red-100 text-red-600",
  };

  const iconColorClass = colorClasses[color as keyof typeof colorClasses] || colorClasses.purple;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${iconColorClass}`}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <div className="text-sm font-medium text-gray-500 truncate">{title}</div>
            <div className="text-2xl font-semibold text-gray-900">{value}</div>
          </div>
        </div>
      </CardContent>
      
      {link && (
        <CardFooter className="bg-gray-50 px-4 py-3 border-t">
          <Link 
            href={link} 
            className="text-sm text-purple-600 hover:text-purple-500 font-medium"
          >
            {linkText}
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
