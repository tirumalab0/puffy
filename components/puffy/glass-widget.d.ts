import * as React from "react";

export interface GlassWidgetProps {
  title?: string;
  info?: any;
  actions?: React.ReactNode;
  onMore?: (...args: any[]) => void;
  moreItems?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassWidget(props: GlassWidgetProps): React.JSX.Element | null;

export interface GlassDeltaProps {
  value?: any;
  invert?: boolean;
  suffix?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassDelta(props: GlassDeltaProps): React.JSX.Element | null;

export interface GlassKpiRowProps {
  items?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassKpiRow(props: GlassKpiRowProps): React.JSX.Element | null;

export interface GlassHintProps {
  children?: React.ReactNode;
  onClick?: (...args: any[]) => void;
  icon?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassHint(props: GlassHintProps): React.JSX.Element | null;

export interface GlassLineChartProps {
  labels?: any;
  series?: any;
  format?: any;
  title?: string;
  height?: any;
  defaultIndex?: any;
  label?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassLineChart(props: GlassLineChartProps): React.JSX.Element | null;

export interface GlassLegendProps {
  items?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassLegend(props: GlassLegendProps): React.JSX.Element | null;

export interface GlassBreakdownProps {
  parts?: any;
  format?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassBreakdown(props: GlassBreakdownProps): React.JSX.Element | null;

export interface GlassHeatmapProps {
  rows?: any;
  values?: any;
  months?: any;
  format?: any;
  levels?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassHeatmap(props: GlassHeatmapProps): React.JSX.Element | null;
