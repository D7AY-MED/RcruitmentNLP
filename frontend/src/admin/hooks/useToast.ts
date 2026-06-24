/**
 * Thin toast helper over react-hot-toast (already a project dependency).
 *
 * Centralising it means pages call `toast.success(...)` / `toast.error(...)`
 * without each importing the library, and we can restyle globally in one place.
 */
import hotToast from "react-hot-toast";

export const toast = {
  success: (msg: string) => hotToast.success(msg),
  error: (msg: string) => hotToast.error(msg),
  loading: (msg: string) => hotToast.loading(msg),
  dismiss: (id?: string) => hotToast.dismiss(id),
  promise: hotToast.promise,
};
