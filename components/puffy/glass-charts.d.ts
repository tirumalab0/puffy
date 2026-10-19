import * as React from "react";

export interface GlassBrushProps {
  values?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  height?: any;
  label?: string;
  minSpan?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassBrush(props: GlassBrushProps): React.JSX.Element | null;

export interface GlassBlockBarsProps {
  labels?: any;
  values?: any;
  blocks?: any;
  format?: any;
  highlight?: any;
  height?: any;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassBlockBars(props: GlassBlockBarsProps): React.JSX.Element | null;

export interface GlassRadialProps {
  items?: any;
  size?: string;
  segments?: any;
  format?: any;
  center?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassRadial(props: GlassRadialProps): React.JSX.Element | null;

export interface GlassRadarProps {
  axes?: any;
  series?: any;
  max?: any;
  size?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassRadar(props: GlassRadarProps): React.JSX.Element | null;

export interface GlassFlowProps {
  from?: any;
  to?: any;
  links?: any;
  height?: any;
  format?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassFlow(props: GlassFlowProps): React.JSX.Element | null;
