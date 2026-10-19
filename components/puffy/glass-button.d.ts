import * as React from "react";

export interface GlassButtonProps {
  variant?: string;
  effect?: string;
  size?: string;
  iconOnly?: boolean;
  motion?: any;
  loading?: boolean;
  disabled?: boolean;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  onClick?: (...args: any[]) => void;
  onPointerEnter?: (...args: any[]) => void;
  onPointerMove?: (...args: any[]) => void;
  onPointerLeave?: (...args: any[]) => void;
  onPointerDown?: (...args: any[]) => void;
  onPointerUp?: (...args: any[]) => void;
  onPointerCancel?: (...args: any[]) => void;
  onKeyDown?: (...args: any[]) => void;
  onKeyUp?: (...args: any[]) => void;
  onBlur?: (...args: any[]) => void;
  [key: string]: any;
}
export declare const GlassButton: React.ForwardRefExoticComponent<GlassButtonProps & React.RefAttributes<any>>;

declare const _default: any;
export default _default;
