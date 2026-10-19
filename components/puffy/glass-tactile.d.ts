import * as React from "react";

export interface GlassKnobProps {
  label?: string;
  value?: any;
  onChange?: (...args: any[]) => void;
  min?: any;
  max?: any;
  step?: any;
  unit?: string;
  size?: string;
  ticks?: any;
  format?: any;
  sound?: boolean;
  haptics?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassKnob(props: GlassKnobProps): React.JSX.Element | null;

export interface GlassOtpProps {
  length?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  onComplete?: (...args: any[]) => void;
  status?: any;
  label?: string;
  numeric?: any;
  fullWidth?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassOtp(props: GlassOtpProps): React.JSX.Element | null;

export interface GlassCounterProps {
  label?: string;
  value?: any;
  onChange?: (...args: any[]) => void;
  min?: any;
  max?: any;
  step?: any;
  unit?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassCounter(props: GlassCounterProps): React.JSX.Element | null;

export interface GlassDropzoneProps {
  accept?: any;
  multiple?: boolean;
  maxSize?: any;
  upload?: any;
  onFiles?: (...args: any[]) => void;
  hint?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassDropzone(props: GlassDropzoneProps): React.JSX.Element | null;

export interface GlassReactionsProps {
  options?: any;
  counts?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassReactions(props: GlassReactionsProps): React.JSX.Element | null;

export interface GlassDeckProps {
  cards?: any;
  render?: any;
  onSwipe?: (...args: any[]) => void;
  emptyText?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassDeck(props: GlassDeckProps): React.JSX.Element | null;

export interface GlassTrayProps {
  label?: string;
  icon?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  width?: any;
  className?: string;
  [key: string]: any;
}
export declare function GlassTray(props: GlassTrayProps): React.JSX.Element | null;

export interface GlassArcDialProps {
  label?: string;
  value?: any;
  onChange?: (...args: any[]) => void;
  min?: any;
  max?: any;
  step?: any;
  unit?: string;
  caption?: string;
  sub?: string;
  format?: any;
  size?: string;
  sound?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassArcDial(props: GlassArcDialProps): React.JSX.Element | null;

export interface GlassRulerProps {
  label?: string;
  value?: any;
  onChange?: (...args: any[]) => void;
  min?: any;
  max?: any;
  step?: any;
  unit?: string;
  current?: any;
  every?: any;
  gap?: any;
  format?: any;
  sound?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassRuler(props: GlassRulerProps): React.JSX.Element | null;
