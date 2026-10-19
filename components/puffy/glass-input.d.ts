import * as React from "react";

export interface GlassInputProps {
  label?: string;
  hint?: string;
  error?: any;
  iconLeft?: React.ReactNode;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  action?: React.ReactNode;
  effect?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare const GlassInput: React.ForwardRefExoticComponent<GlassInputProps & React.RefAttributes<any>>;

export interface GlassTextareaProps {
  label?: string;
  hint?: string;
  error?: any;
  effect?: string;
  className?: string;
  id?: string;
  disabled?: boolean;
  maxLength?: any;
  value?: any;
  defaultValue?: any;
  onChange?: (...args: any[]) => void;
  rows?: any;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare const GlassTextarea: React.ForwardRefExoticComponent<GlassTextareaProps & React.RefAttributes<any>>;

export interface GlassInputCopyProps {
  label?: string;
  value?: any;
  hint?: string;
  effect?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassInputCopy(props: GlassInputCopyProps): React.JSX.Element | null;
