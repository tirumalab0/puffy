import * as React from "react";

export interface GlassBadgeProps {
  tone?: string;
  dot?: boolean;
  effect?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassBadge(props: GlassBadgeProps): React.JSX.Element | null;

export interface GlassBannerProps {
  title?: string;
  tone?: string;
  action?: React.ReactNode;
  onDismiss?: (...args: any[]) => void;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassBanner(props: GlassBannerProps): React.JSX.Element | null;

export interface GlassAccordionProps {
  items?: any;
  defaultOpen?: boolean;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassAccordion(props: GlassAccordionProps): React.JSX.Element | null;

export interface GlassTabsProps {
  tabs?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  variant?: string;
  effect?: string;
  label?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassTabs(props: GlassTabsProps): React.JSX.Element | null;

export interface GlassTableProps {
  columns?: any;
  rows?: any;
  caption?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassTable(props: GlassTableProps): React.JSX.Element | null;

export interface GlassTooltipProps {
  label?: string;
  effect?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassTooltip(props: GlassTooltipProps): React.JSX.Element | null;

export interface GlassDotsProps {
  count?: any;
  index?: any;
  onChange?: (...args: any[]) => void;
  label?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassDots(props: GlassDotsProps): React.JSX.Element | null;

export interface GlassThinkingProps {
  label?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassThinking(props: GlassThinkingProps): React.JSX.Element | null;

export interface GlassDialogProps {
  open?: boolean;
  onClose?: (...args: any[]) => void;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassDialog(props: GlassDialogProps): React.JSX.Element | null;
