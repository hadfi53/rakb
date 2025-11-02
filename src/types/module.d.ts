declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';
  
  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    absoluteStrokeWidth?: boolean;
  }

  export const Car: FC<IconProps>;
  export const Calendar: FC<IconProps>;
  export const DollarSign: FC<IconProps>;
  export const Plus: FC<IconProps>;
  export const Moon: FC<IconProps>;
  export const Sun: FC<IconProps>;
  export const Clock: FC<IconProps>;
  export const XCircle: FC<IconProps>;
  export const TrendingUp: FC<IconProps>;
  export const Users: FC<IconProps>;
  export const MapPin: FC<IconProps>;
  export const Settings: FC<IconProps>;
  export const Bell: FC<IconProps>;
  export const Menu: FC<IconProps>;
  export const ChevronDown: FC<IconProps>;
  export const BarChart: FC<IconProps>;
  export const PieChart: FC<IconProps>;
  export const Activity: FC<IconProps>;
  export const LogOut: FC<IconProps>;
}

declare module '@tanstack/react-query' {
  export interface UseQueryOptions<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  > {
    queryKey: TQueryKey;
    queryFn: QueryFunction<TQueryFnData, TQueryKey>;
    enabled?: boolean;
    retry?: boolean | number | ((failureCount: number, error: TError) => boolean);
    retryDelay?: number | ((retryAttempt: number) => number);
    staleTime?: number;
    cacheTime?: number;
    refetchInterval?: number | false;
    refetchIntervalInBackground?: boolean;
    refetchOnWindowFocus?: boolean;
    refetchOnReconnect?: boolean;
    refetchOnMount?: boolean;
    suspense?: boolean;
    onSuccess?: (data: TData) => void;
    onError?: (error: TError) => void;
    onSettled?: (data: TData | undefined, error: TError | null) => void;
    select?: (data: TQueryFnData) => TData;
  }

  export function useQuery<
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey,
  >(options: UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>): QueryResult<TData, TError>;

  export type QueryKey = readonly unknown[];
  export type QueryFunction<T, TQueryKey extends QueryKey> = (
    context: QueryFunctionContext<TQueryKey>
  ) => T | Promise<T>;
  export type QueryFunctionContext<TQueryKey extends QueryKey> = {
    queryKey: TQueryKey;
    signal: AbortSignal;
  };
  export type QueryResult<TData, TError> = {
    data: TData | undefined;
    error: TError | null;
    isError: boolean;
    isLoading: boolean;
    isSuccess: boolean;
    status: 'idle' | 'loading' | 'error' | 'success';
    isFetching: boolean;
  };
} 