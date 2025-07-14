import { useEffect } from 'react'

interface KeyboardShortcuts {
  'ctrl+enter'?: () => void
  'ctrl+s'?: () => void
  'alt+arrowleft'?: () => void
  'alt+arrowright'?: () => void
  'ctrl+k'?: () => void
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const { ctrlKey, altKey, key } = event
      
      // Ctrl+Enter
      if (ctrlKey && key === 'Enter' && shortcuts['ctrl+enter']) {
        event.preventDefault()
        shortcuts['ctrl+enter']()
      }
      
      // Ctrl+S
      if (ctrlKey && key === 's' && shortcuts['ctrl+s']) {
        event.preventDefault()
        shortcuts['ctrl+s']()
      }
      
      // Alt+Left Arrow
      if (altKey && key === 'ArrowLeft' && shortcuts['alt+arrowleft']) {
        event.preventDefault()
        shortcuts['alt+arrowleft']()
      }
      
      // Alt+Right Arrow
      if (altKey && key === 'ArrowRight' && shortcuts['alt+arrowright']) {
        event.preventDefault()
        shortcuts['alt+arrowright']()
      }
      
      // Ctrl+K (Command palette)
      if (ctrlKey && key === 'k' && shortcuts['ctrl+k']) {
        event.preventDefault()
        shortcuts['ctrl+k']()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [shortcuts])
}