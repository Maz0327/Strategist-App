import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface BreadcrumbStep {
  label: string
  active?: boolean
  completed?: boolean
}

interface ProgressBreadcrumbProps {
  steps: BreadcrumbStep[]
  className?: string
}

export function ProgressBreadcrumb({ steps, className }: ProgressBreadcrumbProps) {
  return (
    <nav className={cn("flex items-center space-x-2 text-sm", className)}>
      {steps.map((step, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-muted-foreground mx-2" />
          )}
          <span
            className={cn(
              "font-medium",
              step.active && "text-primary",
              step.completed && "text-muted-foreground",
              !step.active && !step.completed && "text-muted-foreground"
            )}
          >
            {step.label}
          </span>
        </div>
      ))}
    </nav>
  )
}