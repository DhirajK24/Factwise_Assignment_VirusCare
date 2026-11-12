import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-navy text-white shadow-sm",
        secondary:
          "border-transparent bg-slate-100 text-slate-800",
        destructive:
          "border-rose-200 bg-rose-50 text-rose-700",
        outline:
          "border-slate-200 text-slate-700",
        teal:
          "border-teal-200 bg-teal-50 text-teal-800",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-800 font-semibold",
        warning:
          "border-amber-200 bg-amber-50 text-amber-800",
        fever:
          "border-rose-300 bg-rose-100 text-rose-800 font-bold animate-pulse",
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

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

