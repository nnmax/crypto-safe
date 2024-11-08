import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

export function createGlobalState<T>(
  queryKey: unknown,
  initialData: T,
): () => {
    data: T
    setData: (data: T) => void
    resetData: () => void
  } {
  return () => {
    const queryClient = useQueryClient()

    const { data } = useQuery({
      queryKey: [queryKey],
      queryFn: () => Promise.resolve(initialData),
      initialData,
      refetchInterval: false,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
    })

    const setData = useCallback((data: Parameters<typeof queryClient.setQueriesData<T>>[1]) => {
      queryClient.setQueryData<T>([queryKey], data)
    }, [queryClient])

    const resetData = useCallback(() => {
      queryClient.invalidateQueries({
        queryKey: [queryKey],
      })
      queryClient.refetchQueries({
        queryKey: [queryKey],
      })
    }, [queryClient])

    return useMemo(() => ({ data, setData, resetData }), [data, resetData, setData])
  }
}
