import * as React from "react";

export interface GlassMeterProps {
  value?: any;
  max?: any;
  variant?: string;
  startLabel?: any;
  endLabel?: any;
  tone?: string;
  ticks?: any;
  label?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassMeter(props: GlassMeterProps): React.JSX.Element | null;

export interface GlassWaffleProps {
  parts?: any;
  total?: any;
  cells?: any;
  columns?: any;
  note?: any;
  unit?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassWaffle(props: GlassWaffleProps): React.JSX.Element | null;

export interface GlassForecastProps {
  parts?: any;
  forecast?: any;
  max?: any;
  marker?: any;
  todayLabel?: any;
  maxLabel?: any;
  unit?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassForecast(props: GlassForecastProps): React.JSX.Element | null;

export interface GlassStatStripProps {
  items?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  label?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassStatStrip(props: GlassStatStripProps): React.JSX.Element | null;

export interface GlassTimelineProps {
  items?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassTimeline(props: GlassTimelineProps): React.JSX.Element | null;

export interface GlassTagListProps {
  tags?: any;
  max?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassTagList(props: GlassTagListProps): React.JSX.Element | null;
