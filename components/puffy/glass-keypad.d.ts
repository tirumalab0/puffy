import * as React from "react";

export interface GlassKeypadProps {
  length?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  onComplete?: (...args: any[]) => void;
  mask?: any;
  effect?: string;
  label?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassKeypad(props: GlassKeypadProps): React.JSX.Element | null;

declare const _default: any;
export default _default;
