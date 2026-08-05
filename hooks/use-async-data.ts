'use client';

import { useCallback, useEffect, useState } from 'react';

export function useAsyncData<T>(fetcher: () => Promise<T>, initialValue: T) {
  const [data, setData] = useState<T>(initialValue);

  useEffect(() => {
    let ignore = false;
    fetcher().then((value) => {
      if (!ignore) setData(value);
    });
    return () => {
      ignore = true;
    };
  }, [fetcher]);

  const reload = useCallback(async () => {
    setData(await fetcher());
  }, [fetcher]);

  return { data, setData, reload };
}
