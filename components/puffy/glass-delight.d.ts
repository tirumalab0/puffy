import * as React from "react";

export interface GlassConfirmProps {
  open?: boolean;
  onClose?: (...args: any[]) => void;
  onConfirm?: (...args: any[]) => void;
  title?: string;
  description?: string;
  confirmLabel?: any;
  cancelLabel?: any;
  danger?: any;
  typeToConfirm?: any;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassConfirm(props: GlassConfirmProps): React.JSX.Element | null;

export interface GlassCalendarProps {
  value?: any;
  onChange?: (...args: any[]) => void;
  today?: any;
  min?: any;
  max?: any;
  marked?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassCalendar(props: GlassCalendarProps): React.JSX.Element | null;

export interface GlassPopoverProps {
  trigger?: any;
  children?: React.ReactNode;
  align?: string;
  className?: string;
  [key: string]: any;
}
export declare function GlassPopover(props: GlassPopoverProps): React.JSX.Element | null;

export interface GlassHoverCardProps {
  trigger?: any;
  children?: React.ReactNode;
  delay?: any;
  className?: string;
  [key: string]: any;
}
export declare function GlassHoverCard(props: GlassHoverCardProps): React.JSX.Element | null;

export interface GlassHoldButtonProps {
  children?: React.ReactNode;
  doneLabel?: any;
  duration?: any;
  onConfirm?: (...args: any[]) => void;
  danger?: any;
  className?: string;
  [key: string]: any;
}
export declare function GlassHoldButton(props: GlassHoldButtonProps): React.JSX.Element | null;

export interface GlassSwipeRowProps {
  children?: React.ReactNode;
  onDelete?: (...args: any[]) => void;
  label?: string;
  className?: string;
  [key: string]: any;
}
export declare function GlassSwipeRow(props: GlassSwipeRowProps): React.JSX.Element | null;

export interface GlassPasswordStrengthProps {
  value?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassPasswordStrength(props: GlassPasswordStrengthProps): React.JSX.Element | null;

export interface GlassRatingProps {
  value?: any;
  onChange?: (...args: any[]) => void;
  max?: any;
  size?: string;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassRating(props: GlassRatingProps): React.JSX.Element | null;

export interface GlassUndoPillProps {
  show?: any;
  message?: any;
  onUndo?: (...args: any[]) => void;
  onExpire?: (...args: any[]) => void;
  duration?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassUndoPill(props: GlassUndoPillProps): React.JSX.Element | null;

export interface GlassToastStackProps {
  items?: any;
  onDismiss?: (...args: any[]) => void;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassToastStack(props: GlassToastStackProps): React.JSX.Element | null;

export interface GlassBellProps {
  items?: any;
  onRead?: (...args: any[]) => void;
  onReadAll?: (...args: any[]) => void;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassBell(props: GlassBellProps): React.JSX.Element | null;

export interface GlassTickerProps {
  value?: any;
  format?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassTicker(props: GlassTickerProps): React.JSX.Element | null;

export interface GlassFloatingInputProps {
  label?: string;
  value?: any;
  onChange?: (...args: any[]) => void;
  type?: any;
  hint?: string;
  error?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassFloatingInput(props: GlassFloatingInputProps): React.JSX.Element | null;

export interface GlassRangeSliderProps {
  min?: any;
  max?: any;
  step?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  format?: any;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassRangeSlider(props: GlassRangeSliderProps): React.JSX.Element | null;

export interface GlassCheckRingProps {
  done?: any;
  delay?: any;
  size?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassCheckRing(props: GlassCheckRingProps): React.JSX.Element | null;

export interface GlassTypeInProps {
  text?: string;
  speed?: any;
  delay?: any;
  mask?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassTypeIn(props: GlassTypeInProps): React.JSX.Element | null;

export interface GlassMetalTextProps {
  children?: React.ReactNode;
  as?: any;
  className?: string;
  [key: string]: any;
}
export declare function GlassMetalText(props: GlassMetalTextProps): React.JSX.Element | null;

export interface GlassEdgeCardProps {
  title?: string;
  text?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassEdgeCard(props: GlassEdgeCardProps): React.JSX.Element | null;

export interface GlassEdgeInputProps {
  label?: string;
  icon?: React.ReactNode;
  done?: any;
  hint?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassEdgeInput(props: GlassEdgeInputProps): React.JSX.Element | null;

export interface GlassEdgeButtonProps {
  variant?: string;
  tone?: string;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassEdgeButton(props: GlassEdgeButtonProps): React.JSX.Element | null;

export interface GlassEdgeToastProps {
  title?: string;
  text?: string;
  tone?: string;
  duration?: any;
  onClose?: (...args: any[]) => void;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassEdgeToast(props: GlassEdgeToastProps): React.JSX.Element | null;

export interface GlassEdgeAlertProps {
  tone?: string;
  title?: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  onDismiss?: (...args: any[]) => void;
  className?: string;
  [key: string]: any;
}
export declare function GlassEdgeAlert(props: GlassEdgeAlertProps): React.JSX.Element | null;
