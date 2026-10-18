import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

// Small styled Radix primitive using the shadcn/ui composition pattern.
export function Dialog({
  title,
  description,
  children,
  open,
  onOpenChange,
  trigger,
  busy = false,
}: {
  title: string
  description: string
  children: ReactNode
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger?: ReactNode
  busy?: boolean
}) {
  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!busy) onOpenChange(next)
      }}
    >
      {trigger && <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>}
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content
          className="dialog-content"
          onOpenAutoFocus={(event) => {
            const path = document.getElementById('repository-path')
            if (path) {
              event.preventDefault()
              path.focus()
            }
          }}
        >
          <DialogPrimitive.Title className="dialog-title">{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description className="dialog-description">
            {description}
          </DialogPrimitive.Description>
          {children}
          <DialogPrimitive.Close
            className="icon-button dialog-close"
            aria-label="Close dialog"
            disabled={busy}
          >
            <X size={18} />
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
