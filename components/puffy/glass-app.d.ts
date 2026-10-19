import * as React from "react";

export interface GlassAvatarProps {
  name?: string;
  src?: string;
  size?: string;
  status?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassAvatar(props: GlassAvatarProps): React.JSX.Element | null;

export interface GlassAvatarGroupProps {
  people?: any;
  max?: any;
  size?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassAvatarGroup(props: GlassAvatarGroupProps): React.JSX.Element | null;

export interface GlassBreadcrumbsProps {
  items?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassBreadcrumbs(props: GlassBreadcrumbsProps): React.JSX.Element | null;

export interface GlassSidebarProps {
  sections?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  collapsed?: any;
  effect?: string;
  label?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassSidebar(props: GlassSidebarProps): React.JSX.Element | null;

export interface GlassChartProps {
  type?: any;
  labels?: any;
  series?: any;
  height?: any;
  format?: any;
  label?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassChart(props: GlassChartProps): React.JSX.Element | null;

export interface GlassSparklineProps {
  values?: any;
  width?: any;
  height?: any;
  tone?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassSparkline(props: GlassSparklineProps): React.JSX.Element | null;

export interface GlassDonutProps {
  parts?: any;
  size?: string;
  label?: string;
  format?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassDonut(props: GlassDonutProps): React.JSX.Element | null;

export interface GlassStatProps {
  label?: string;
  value?: any;
  change?: any;
  trend?: any;
  footnote?: any;
  invert?: boolean;
  effect?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassStat(props: GlassStatProps): React.JSX.Element | null;

export interface GlassPaginationProps {
  page?: any;
  pages?: any;
  onChange?: (...args: any[]) => void;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassPagination(props: GlassPaginationProps): React.JSX.Element | null;

export interface GlassDataTableProps {
  columns?: any;
  rows?: any;
  selectable?: boolean;
  bulkActions?: any;
  searchable?: any;
  pageSize?: any;
  toolbar?: any;
  rowActions?: any;
  empty?: any;
  caption?: string;
  searchPlaceholder?: any;
  query?: any;
  total?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassDataTable(props: GlassDataTableProps): React.JSX.Element | null;
