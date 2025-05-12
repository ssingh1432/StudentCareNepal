import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 
  | 'default' 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'green' 
  | 'yellow' 
  | 'red' 
  | 'blue' 
  | 'purple' 
  | 'gray';

export interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className }) => {
  const baseClasses = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
  
  const variantClasses = {
    default: "bg-primary-100 text-primary-800",
    primary: "bg-primary-100 text-primary-800",
    secondary: "bg-secondary bg-opacity-80 text-secondary-foreground",
    outline: "border border-primary text-primary",
    green: "bg-green-100 text-green-800",
    yellow: "bg-yellow-100 text-yellow-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    purple: "bg-purple-100 text-purple-800",
    gray: "bg-gray-100 text-gray-800"
  };
  
  return (
    <span className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </span>
  );
};

// Specific badge components for common use cases
export const ClassBadge: React.FC<{ className: string }> = ({ className }) => {
  const getBadgeVariant = (): BadgeVariant => {
    switch (className) {
      case 'Nursery': return 'yellow';
      case 'LKG': return 'blue';
      case 'UKG': return 'green';
      default: return 'gray';
    }
  };
  
  return <Badge variant={getBadgeVariant()}>{className}</Badge>;
};

export const LearningAbilityBadge: React.FC<{ ability: string }> = ({ ability }) => {
  const getBadgeVariant = (): BadgeVariant => {
    switch (ability) {
      case 'Talented': return 'green';
      case 'Average': return 'yellow';
      case 'Slow Learner': return 'red';
      default: return 'gray';
    }
  };
  
  return <Badge variant={getBadgeVariant()}>{ability}</Badge>;
};

export const WritingSpeedBadge: React.FC<{ speed: string }> = ({ speed }) => {
  const getBadgeVariant = (): BadgeVariant => {
    switch (speed) {
      case 'Speed Writing': return 'blue';
      case 'Slow Writing': return 'yellow';
      case 'N/A': return 'gray';
      default: return 'gray';
    }
  };
  
  return <Badge variant={getBadgeVariant()}>{speed === 'N/A' ? 'Not Applicable' : speed}</Badge>;
};

export const ProgressBadge: React.FC<{ rating: string }> = ({ rating }) => {
  const getBadgeVariant = (): BadgeVariant => {
    switch (rating) {
      case 'Excellent': return 'green';
      case 'Good': return 'yellow';
      case 'Needs Improvement': return 'red';
      default: return 'gray';
    }
  };
  
  return <Badge variant={getBadgeVariant()}>{rating}</Badge>;
};

export const PlanTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const getBadgeVariant = (): BadgeVariant => {
    switch (type) {
      case 'Annual': return 'green';
      case 'Monthly': return 'purple';
      case 'Weekly': return 'yellow';
      default: return 'gray';
    }
  };
  
  return <Badge variant={getBadgeVariant()}>{type}</Badge>;
};

export default Badge;
