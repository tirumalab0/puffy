import * as React from "react";

export interface GlassCommandProps {
  open?: boolean;
  onOpenChange?: (...args: any[]) => void;
  groups?: any;
  onSelect?: (...args: any[]) => void;
  placeholder?: string;
  hotkey?: any;
  effect?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassCommand(props: GlassCommandProps): React.JSX.Element | null;

export interface GlassDrawerProps {
  open?: boolean;
  onClose?: (...args: any[]) => void;
  title?: string;
  description?: string;
  side?: any;
  actions?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassDrawer(props: GlassDrawerProps): React.JSX.Element | null;

export declare function toast(...args: any[]): any;

export declare function dismissToast(...args: any[]): any;

export interface GlassToasterProps {
  position?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassToaster(props: GlassToasterProps): React.JSX.Element | null;

export interface GlassEmptyProps {
  icon?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassEmpty(props: GlassEmptyProps): React.JSX.Element | null;

export interface GlassSkeletonProps {
  width?: any;
  height?: any;
  radius?: any;
  lines?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassSkeleton(props: GlassSkeletonProps): React.JSX.Element | null;

export interface GlassDateRangeProps {
  value?: any;
  onChange?: (...args: any[]) => void;
  label?: string;
  presets?: any;
  effect?: string;
  today?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassDateRange(props: GlassDateRangeProps): React.JSX.Element | null;

export interface GlassStepperProps {
  steps?: any;
  current?: any;
  onStepClick?: (...args: any[]) => void;
  orientation?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassStepper(props: GlassStepperProps): React.JSX.Element | null;
