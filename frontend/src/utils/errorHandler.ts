import { AxiosError } from 'axios';

export interface ValidationError {
  path: string;
  message: string;
}

export interface ApiError {
  message: string;
  errors?: ValidationError[];
  activeSessionId?: number;
}

/**
 * Extract error message and validation errors from API error response
 */
export const extractError = (error: unknown): { message: string; fieldErrors: Record<string, string>; data?: any } => {
  const axiosError = error as AxiosError<{ message?: string; errors?: any[] }>;
  const errorData = axiosError.response?.data;
  
  const message = errorData?.message || axiosError.message || 'An error occurred';
  const fieldErrors: Record<string, string> = {};

  // Extract validation errors
  if (errorData?.errors && Array.isArray(errorData.errors)) {
    errorData.errors.forEach((validationError: any) => {
      // Handle validation errors with path
      if (validationError.path) {
        const fieldName = validationError.path.replace('body.', '').replace('query.', '').replace('params.', '');
        if (fieldName) {
          fieldErrors[fieldName] = validationError.message;
        }
      }
      // Handle validation errors with activeSessionId
      if (validationError.activeSessionId) {
        // This is handled separately
      }
    });
  }

  return {
    message,
    fieldErrors,
    data: errorData,
  };
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: unknown): string => {
  const axiosError = error as AxiosError<{ message?: string }>;
  
  if (axiosError.response) {
    const status = axiosError.response.status;
    const errorData = axiosError.response.data;
    
    if (errorData?.message) {
      return errorData.message;
    }
    
    switch (status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'You are not authorized. Please login again.';
      case 403:
        return 'You do not have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 409:
        return 'A conflict occurred. Please try again.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
  
  if (axiosError.request) {
    return 'Network error. Please check your connection.';
  }
  
  return axiosError.message || 'An unexpected error occurred';
};

