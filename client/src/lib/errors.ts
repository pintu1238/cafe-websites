import axios from 'axios';

export function getApiError(error: unknown, fallback = "We couldn't complete that request. Please try again.") {
  if (axios.isAxiosError(error)) return (error.response?.data as { message?: string } | undefined)?.message ?? fallback;
  return fallback;
}

export function getApiErrorCode(error: unknown): string | undefined {
  if (!axios.isAxiosError(error)) return undefined;
  return (error.response?.data as { code?: string } | undefined)?.code;
}
