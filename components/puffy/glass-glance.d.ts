import * as React from "react";

export interface GlassGlanceProps {
  icon?: React.ReactNode;
  title?: string;
  meta?: string;
  tone?: string;
  fill?: any;
  reveal?: any;
  size?: string;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassGlance(props: GlassGlanceProps): React.JSX.Element | null;

export interface GlassWeatherGlanceProps {
  place?: any;
  time?: any;
  temp?: any;
  unit?: string;
  sky?: any;
  hours?: any;
  rain?: any;
  tone?: string;
  fill?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassWeatherGlance(props: GlassWeatherGlanceProps): React.JSX.Element | null;

export declare function useLiveWeather(...args: any[]): any;

export interface GlassTempGlanceProps {
  place?: any;
  time?: any;
  temp?: any;
  unit?: string;
  sky?: any;
  feels?: any;
  low?: any;
  high?: any;
  points?: any;
  hours?: any;
  sunrise?: any;
  sunset?: any;
  humidity?: any;
  wind?: any;
  tone?: string;
  fill?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassTempGlance(props: GlassTempGlanceProps): React.JSX.Element | null;

export interface GlassFlightGlanceProps {
  departs?: any;
  from?: any;
  to?: any;
  gate?: any;
  status?: any;
  note?: any;
  progress?: any;
  tone?: string;
  fill?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassFlightGlance(props: GlassFlightGlanceProps): React.JSX.Element | null;

export interface GlassSleepGlanceProps {
  date?: any;
  score?: any;
  hours?: any;
  mins?: any;
  window?: any;
  awake?: any;
  stages?: any;
  ticks?: any;
  bedtime?: any;
  usual?: any;
  tone?: string;
  fill?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassSleepGlance(props: GlassSleepGlanceProps): React.JSX.Element | null;

export interface GlassChecklistGlanceProps {
  title?: string;
  icon?: React.ReactNode;
  sections?: any;
  onToggle?: (...args: any[]) => void;
  tone?: string;
  fill?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassChecklistGlance(props: GlassChecklistGlanceProps): React.JSX.Element | null;

export interface GlassMoversGlanceProps {
  lead?: any;
  leadName?: any;
  rows?: any;
  date?: any;
  price?: any;
  spark?: any;
  tone?: string;
  fill?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassMoversGlance(props: GlassMoversGlanceProps): React.JSX.Element | null;

export interface GlassPaycheckGlanceProps {
  title?: string;
  income?: any;
  parts?: any;
  currency?: string;
  tone?: string;
  fill?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassPaycheckGlance(props: GlassPaycheckGlanceProps): React.JSX.Element | null;

export interface GlassRangeGlanceProps {
  title?: string;
  icon?: React.ReactNode;
  value?: any;
  unit?: string;
  low?: any;
  high?: any;
  segments?: any;
  caption?: string;
  tone?: string;
  fill?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassRangeGlance(props: GlassRangeGlanceProps): React.JSX.Element | null;

export declare const GLANCE_ICONS: any;
