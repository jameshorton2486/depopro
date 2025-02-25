
import { supabase } from "@/integrations/supabase/client";

export interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

export const logError = async (error: Error, context: ErrorContext) => {
  try {
    const { error: insertError } = await supabase
      .from('error_logs')
      .insert({
        error_message: error.message,
        stack_trace: error.stack,
        context,
        source: 'application'
      });

    if (insertError) {
      console.error('Failed to log error:', insertError);
    }
  } catch (loggingError) {
    console.error('Error during error logging:', loggingError);
  }
};

// Utility function to wrap async functions with error logging
export const withErrorLogging = <T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: Omit<ErrorContext, 'action'>
) => {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      await logError(error as Error, {
        ...context,
        action: fn.name || 'anonymous'
      });
      throw error;
    }
  };
};
