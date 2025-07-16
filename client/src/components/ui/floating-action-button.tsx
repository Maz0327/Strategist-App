import { Plus, Zap, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface FloatingActionButtonProps {
  onNewSignal: () => void
  onQuickAnalysis: () => void
  onNewBrief: () => void
}

export function FloatingActionButton({ onNewSignal, onQuickAnalysis, onNewBrief }: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 space-y-2 animate-in fade-in-0 zoom-in-95">
          <Button
            size="sm"
            variant="secondary"
            onClick={onNewBrief}
            className="flex items-center gap-2 shadow-lg"
          >
            <FileText className="h-4 w-4" />
            New Brief
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onQuickAnalysis}
            className="flex items-center gap-2 shadow-lg"
          >
            <Zap className="h-4 w-4" />
            Quick Analysis
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={onNewSignal}
            className="flex items-center gap-2 shadow-lg"
          >
            <Plus className="h-4 w-4" />
            New Signal
          </Button>
        </div>
      )}
      
      <Button
        size="lg"
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Plus className={`h-6 w-6 transition-transform duration-200 ${isOpen ? 'rotate-45' : ''}`} />
      </Button>
    </div>
  )
}