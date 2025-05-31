import { useState } from "react";
import { toast } from "sonner";

type AsyncFn<TParam, TResult> = (param: TParam) => Promise<TResult>;

function useFetch<TParam, TResult>(cb: AsyncFn<TParam, TResult>) {
  const [data, setData] = useState<TResult | undefined>(undefined);
  const [loading, setLoading] = useState<boolean | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const fn = async (param: TParam): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const response = await cb(param);
      setData(response);
    } catch (err: any) {
      const errorMessage = err?.message || "An error occurred";
      setError(err);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
}

export default useFetch;
