import { toast as baseToast } from "sonner"

export const toast = {
  success: (message: string, description?: string) =>
    baseToast.success(message, {
      description,
      className: "border-green-500 bg-green-50 text-green-800",
    }),

  error: (message: string, description?: string) =>
    baseToast.error(message, {
      description,
    }),

  warning: (message: string, description?: string) =>
    baseToast(message, {
      description,
      className: "border-yellow-500 bg-yellow-50 text-yellow-800",
    }),

  info: (message: string, description?: string) =>
    baseToast(message, {
      description,
      className: "border-blue-500 bg-blue-50 text-blue-800",
    }),
}
