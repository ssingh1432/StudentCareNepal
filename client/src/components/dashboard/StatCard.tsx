import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: "purple" | "blue" | "green" | "yellow" | "red";
}

const colorClasses = {
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-600"
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-600"
  },
  green: {
    bg: "bg-green-100",
    text: "text-green-600"
  },
  yellow: {
    bg: "bg-yellow-100",
    text: "text-yellow-600"
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-600"
  }
};

export default function StatCard({ title, value, icon, color }: StatCardProps) {
  const { bg, text } = colorClasses[color];

  return (
    <Card>
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 ${bg} rounded-md p-3`}>
            <i className={`fas ${icon} ${text}`}></i>
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
      </CardContent>
    </Card>
  );
}
