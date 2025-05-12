import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-primary bg-opacity-10 text-primary-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline:
          "text-foreground border border-input hover:bg-accent hover:text-accent-foreground",
        // Class-specific badges
        nursery: "bg-yellow-100 text-yellow-800",
        lkg: "bg-blue-100 text-blue-800",
        ukg: "bg-green-100 text-green-800",
        // Plan type badges
        annual: "bg-purple-100 text-purple-800",
        monthly: "bg-indigo-100 text-indigo-800",
        weekly: "bg-blue-100 text-blue-800",
        // Progress rating badges
        excellent: "bg-green-100 text-green-800",
        good: "bg-yellow-100 text-yellow-800",
        "needs-improvement": "bg-red-100 text-red-800",
        // Learning ability badges
        talented: "bg-green-100 text-green-800",
        average: "bg-yellow-100 text-yellow-800",
        "slow-learner": "bg-red-100 text-red-800",
        // Writing speed badges
        "speed-writing": "bg-blue-100 text-blue-800",
        "slow-writing": "bg-orange-100 text-orange-800",
        "na": "bg-gray-100 text-gray-800",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function BadgeCustom({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { BadgeCustom, badgeVariants };
