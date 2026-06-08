type ToastFn = (message: string) => void

const toast = {
  success: (message: string) => {
    if (typeof window !== "undefined") {
      console.log(`✅ SUCCESS: ${message}`)
    }
  },
  info: (message: string) => {
    if (typeof window !== "undefined") {
      console.log(`ℹ️ INFO: ${message}`)
    }
  },
  error: (message: string) => {
    if (typeof window !== "undefined") {
      console.error(`❌ ERROR: ${message}`)
    }
  },
} as Record<string, ToastFn>

export { toast }
