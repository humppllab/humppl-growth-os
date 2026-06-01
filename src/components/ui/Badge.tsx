import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variants = {
    default: "bg-blue-100 text-blue-800 hover:bg-blue-200/80",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200/80",
    destructive: "bg-red-100 text-red-800 hover:bg-red-200/80",
    success: "bg-green-100 text-green-800 hover:bg-green-200/80",
    warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200/80",
    outline: "text-gray-950 border border-gray-200",
  };

  return (
    <div className={`${baseStyles} ${variants[variant]} ${className || ''}`} {...props} />
  )
}

export { Badge }
