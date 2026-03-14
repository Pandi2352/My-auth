import { toast } from 'sonner';
import type { AxiosError } from 'axios';

interface ApiErrorResponse {
  success: false;
  code: number;
  error: string;
  error_description: string;
}

export function getErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<ApiErrorResponse>;

  if (axiosError.response?.data?.error_description) {
    return axiosError.response.data.error_description;
  }

  if (axiosError.response?.data?.error) {
    return axiosError.response.data.error;
  }

  if (axiosError.message) {
    return axiosError.message;
  }

  return 'Something went wrong. Please try again.';
}

export function handleApiError(error: unknown, fallback?: string): void {
  const message = fallback || getErrorMessage(error);
  toast.error(message);
}
