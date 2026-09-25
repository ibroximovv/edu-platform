import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { errorMessage } from '../http';

interface MutationOpts<TData, TVars> {
  invalidate?: QueryKey[];
  success?: string | ((data: TData, vars: TVars) => string);
  onSuccess?: (data: TData, vars: TVars) => void;
  silentError?: boolean;
}

/** useMutation + cache invalidation + toasts, the one pattern every form uses. */
export function useApiMutation<TVars = void, TData = unknown>(fn: (vars: TVars) => Promise<TData>, opts: MutationOpts<TData, TVars> = {}) {
  const qc = useQueryClient();
  return useMutation<TData, Error, TVars>({
    mutationFn: fn,
    onSuccess: async (data, vars) => {
      if (opts.success) toast.success(typeof opts.success === 'function' ? opts.success(data, vars) : opts.success);
      opts.onSuccess?.(data, vars);
      await Promise.all((opts.invalidate ?? []).map((queryKey) => qc.invalidateQueries({ queryKey })));
    },
    onError: (e) => {
      if (!opts.silentError) toast.error(errorMessage(e));
    },
  });
}
