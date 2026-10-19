import * as React from "react";

export interface GlassDropdownProps {
  label?: string;
  items?: any;
  onSelect?: (...args: any[]) => void;
  effect?: string;
  variant?: string;
  size?: string;
  align?: string;
  iconLeft?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassDropdown(props: GlassDropdownProps): React.JSX.Element | null;

declare const _default: any;
export default _default;
