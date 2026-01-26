import {
    MutationFunctionOptions,
    MutationResult,
    MutationTuple,
} from "@apollo/client";
import { useDebouncedCallback } from "use-debounce";

export function useDebouncedMutation<TData, TVariables>(
  [mutation, result]: MutationTuple<TData, TVariables>,
  options: {
    delay: number;
    maxWait?: number;
    leading?: boolean;
    trailing?: boolean;
  } = {
    delay: 1000,
  }
): [
  (options?: MutationFunctionOptions<TData, TVariables> | undefined) => void,
  {
    result: MutationResult<TData>;
    cancel: () => void;
    callPending: () => void;
  }
] {
  const debounced = useDebouncedCallback(
    mutation,
    options.delay,
    options
  );
  return [debounced, { result, cancel: debounced.cancel, callPending: debounced.isPending }];
}
