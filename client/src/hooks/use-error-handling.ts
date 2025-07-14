import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { matchErrorPattern, ErrorMessage } from "@/../../shared/error-messages";

export interface ApiError {
  error?: ErrorMessage;
  validationErrors?: Array<{ field: string; message: string }>;
  message?: string;
}

export function useErrorHandling() {
  const { toast } = useToast();

  const handleApiError = (error: any): ErrorMessage => {
    // Handle network errors
    if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
      return {
        title: "Connection Problem",
        message: "We're having trouble connecting to our servers.",
        solution: "Check your internet connection and try again",
        code: "NET_001"
      };
    }

    // Handle HTTP errors
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as ApiError;

      // Use structured error if available
      if (data.error) {
        return data.error;
      }

      // Handle specific status codes
      switch (status) {
        case 400:
          return {
            title: "Invalid Request",
            message: data.message || "The request contains invalid information.",
            solution: "Check your input and try again",
            code: "VAL_001"
          };
        case 401:
          return {
            title: "Please Log In",
            message: "You need to be logged in to access this feature.",
            solution: "Sign in to your account or create a new one",
            code: "AUTH_006"
          };
        case 403:
          return {
            title: "Access Denied",
            message: "You don't have permission to access this feature.",
            solution: "Contact an administrator if you believe this is a mistake",
            code: "AUTH_007"
          };
        case 404:
          return {
            title: "Not Found",
            message: "The requested item doesn't exist or has been removed.",
            solution: "Check that you're using the correct link or refresh the page",
            code: "DB_002"
          };
        case 429:
          return {
            title: "Too Many Requests",
            message: "You've made too many requests in a short time.",
            solution: "Please wait a moment before trying again",
            code: "API_002"
          };
        case 500:
        case 502:
        case 503:
          return {
            title: "Server Error",
            message: "We're experiencing technical difficulties.",
            solution: "Please try again in a few minutes",
            code: "GEN_001"
          };
        default:
          return matchErrorPattern(data.message || "An error occurred");
      }
    }

    // Handle other errors
    return matchErrorPattern(error.message || error.toString());
  };

  const showErrorToast = (error: ErrorMessage) => {
    toast({
      title: error.title,
      description: `${error.message}${error.solution ? '. ' + error.solution : ''}`,
      variant: "destructive",
    });
  };

  const handleMutationError = (error: any) => {
    const errorMessage = handleApiError(error);
    showErrorToast(errorMessage);
    return errorMessage;
  };

  return {
    handleApiError,
    showErrorToast,
    handleMutationError,
  };
}

// Enhanced mutation hook with error handling
export function useApiMutation<TData = unknown, TError = unknown, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: ErrorMessage, variables: TVariables) => void;
    showErrorToast?: boolean;
    invalidateQueries?: string[];
  }
) {
  const queryClient = useQueryClient();
  const { handleMutationError } = useErrorHandling();

  return useMutation({
    mutationFn,
    onSuccess: (data, variables) => {
      if (options?.onSuccess) {
        options.onSuccess(data, variables);
      }
      
      // Invalidate specified queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: [queryKey] });
        });
      }
    },
    onError: (error, variables) => {
      const errorMessage = handleMutationError(error);
      
      if (options?.onError) {
        options.onError(errorMessage, variables);
      }
      
      // Don't show toast if explicitly disabled
      if (options?.showErrorToast !== false) {
        // Error toast is already shown by handleMutationError
      }
    },
  });
}