import * as React from "react";

export interface GlassComboboxProps {
  label?: string;
  options?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  placeholder?: string;
  effect?: string;
  emptyText?: any;
  hint?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassCombobox(props: GlassComboboxProps): React.JSX.Element | null;

declare const _default: any;
export default _default;
