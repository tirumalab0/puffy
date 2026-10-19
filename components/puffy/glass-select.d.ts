import * as React from "react";

export interface GlassSelectProps {
  label?: string;
  options?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  placeholder?: string;
  effect?: string;
  disabled?: boolean;
  hint?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassSelect(props: GlassSelectProps): React.JSX.Element | null;

declare const _default: any;
export default _default;
