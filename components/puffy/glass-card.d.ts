import * as React from "react";

export interface GlassCardProps {
  title?: string;
  text?: string;
  level?: any;
  active?: any;
  effect?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassCard(props: GlassCardProps): React.JSX.Element | null;

export interface GlassProgressProps {
  value?: any;
  max?: any;
  label?: string;
  showValue?: boolean;
  accent?: boolean;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassProgress(props: GlassProgressProps): React.JSX.Element | null;
