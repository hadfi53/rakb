declare module 'react' {
  export interface ReactElement {
    type: any;
    props: any;
    key: string | null;
  }

  export interface ChangeEvent<T = Element> {
    target: T & {
      name: string;
      value: string;
    };
    currentTarget: T;
    preventDefault(): void;
    stopPropagation(): void;
  }

  export function useState<T>(initialState: T | (() => T)): [T, (newState: T | ((prevState: T) => T)) => void];
  export function useEffect(effect: () => void | (() => void), deps?: ReadonlyArray<any>): void;
  export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: ReadonlyArray<any>): T;
  export function useMemo<T>(factory: () => T, deps: ReadonlyArray<any> | undefined): T;
  export function useRef<T>(initialValue: T): { current: T };
  export function useContext<T>(context: React.Context<T>): T;
  export function createContext<T>(defaultValue: T): React.Context<T>;
  
  export interface Context<T> {
    Provider: Provider<T>;
    Consumer: Consumer<T>;
    displayName?: string;
  }
  
  export interface Provider<T> {
    $$typeof: symbol;
    _context: Context<T>;
  }
  
  export interface Consumer<T> {
    $$typeof: symbol;
    _context: Context<T>;
  }
  
  export * from 'react';
}

declare module 'react-router-dom' {
  export interface NavigateFunction {
    (to: string | number, options?: { replace?: boolean; state?: any }): void;
    (delta: number): void;
  }

  export interface NavigateProps {
    to: string;
    replace?: boolean;
    state?: any;
  }

  export function Navigate(props: NavigateProps): JSX.Element;
  export function useNavigate(): NavigateFunction;
  export function useLocation(): Location;
  export function useParams<K extends string = string>(): Record<K, string | undefined>;
  export function Link(props: LinkProps): JSX.Element;
  export function BrowserRouter(props: { children?: React.ReactNode }): JSX.Element;
  export function Routes(props: { children?: React.ReactNode }): JSX.Element;
  export function Route(props: RouteProps): JSX.Element;
  
  export * from 'react-router-dom';
}

declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';

  export interface IconProps extends SVGProps<SVGSVGElement> {
    size?: number | string;
    absoluteStrokeWidth?: boolean;
  }

  export const User: FC<IconProps>;
  export const Users: FC<IconProps>;
  export const Phone: FC<IconProps>;
  export const Mail: FC<IconProps>;
  export const MapPin: FC<IconProps>;
  export const Calendar: FC<IconProps>;
  export const Shield: FC<IconProps>;
  export const Bell: FC<IconProps>;
  export const Car: FC<IconProps>;
  export const Camera: FC<IconProps>;
  export const CheckCircle: FC<IconProps>;
  export const AlertCircle: FC<IconProps>;
  export const Clock: FC<IconProps>;
  export const Star: FC<IconProps>;
  export const ChevronRight: FC<IconProps>;
  export const Key: FC<IconProps>;
  export const FileText: FC<IconProps>;
  export const MessageSquare: FC<IconProps>;
  export const ArrowLeft: FC<IconProps>;
  export const Upload: FC<IconProps>;
  export const Lock: FC<IconProps>;
  export const Moon: FC<IconProps>;
  export const Sun: FC<IconProps>;
  export const Globe: FC<IconProps>;
  export const Trash2: FC<IconProps>;
  export const LogOut: FC<IconProps>;
  export const Navigation: FC<IconProps>;
  export const Fuel: FC<IconProps>;
  export const Briefcase: FC<IconProps>;
  export const Gauge: FC<IconProps>;
  export const Paintbrush: FC<IconProps>;
  export const Settings: FC<IconProps>;
  export const Loader2: FC<IconProps>;
  export const RotateCcw: FC<IconProps>;
}

declare module '@tanstack/react-query' {
  export * from '@tanstack/react-query';
}

declare module 'recharts' {
  import { FC, SVGProps } from 'react';

  interface Props extends SVGProps<SVGElement> {
    children?: React.ReactNode;
  }

  export const LineChart: FC<Props>;
  export const Line: FC<Props>;
  export const XAxis: FC<Props>;
  export const YAxis: FC<Props>;
  export const CartesianGrid: FC<Props>;
  export const Tooltip: FC<Props>;
  export const ResponsiveContainer: FC<Props>;
  export const AreaChart: FC<Props>;
  export const Area: FC<Props>;
  export const PieChart: FC<Props>;
  export const Pie: FC<Props>;
  export const Cell: FC<Props>;

  export * from 'recharts';
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
} 