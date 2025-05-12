import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  href?: string;
  linkText?: string;
  className?: string;
  iconClassName?: string;
  valueClassName?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  href,
  linkText = "View all",
  className,
  iconClassName,
  valueClassName
}) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3 bg-primary-100", iconClassName)}>
            {icon}
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">
                {title}
              </dt>
              <dd className="flex items-baseline">
                <div className={cn("text-2xl font-semibold text-gray-900", valueClassName)}>
                  {value}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </CardContent>
      
      {href && (
        <div className="bg-gray-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <a 
              href={href} 
              className="font-medium text-primary hover:text-primary-focus"
            >
              {linkText}
            </a>
          </div>
        </div>
      )}
    </Card>
  );
};

export default StatCard;
