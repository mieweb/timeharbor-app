"use client"

import { CheckCircle, XCircle, Info, AlertTriangle, X } from "lucide-react"
import { useAppStore } from "@/lib/store"
import { cn } from "@/lib/utils"

const toastConfig = {
  success: { icon: CheckCircle, className: "bg-success text-success-foreground" },
  error: { icon: XCircle, className: "bg-destructive text-destructive-foreground" },
  info: { icon: Info, className: "bg-primary text-primary-foreground" },
  warning: { icon: AlertTriangle, className: "bg-warning text-warning-foreground" },
}

export function ToastContainer() {
  const toasts = useAppStore((state) => state.toasts)
  const removeToast = useAppStore((state) => state.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="toast-container fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const config = toastConfig[toast.type]
        const Icon = config.icon

        return (
          <div
            key={toast.id}
            className={cn(
              "toast-item flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg animate-in slide-in-from-top-2 fade-in",
              config.className,
            )}
          >
            <Icon className="toast-item-icon h-5 w-5 shrink-0" />
            <p className="toast-item-message flex-1 text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="toast-item-dismiss shrink-0 rounded-full p-1 hover:bg-white/20 transition-colors"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </button>
          </div>
        )
      })}
    </div>
  )
}
