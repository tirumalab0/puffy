import * as React from "react";

export interface GlassButtonGroupProps {
  items?: any;
  variant?: string;
  size?: string;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassButtonGroup(props: GlassButtonGroupProps): React.JSX.Element | null;

export interface GlassToggleProps {
  pressed?: boolean;
  onChange?: (...args: any[]) => void;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  label?: string;
  size?: string;
  className?: string;
  [key: string]: any;
}
export declare function GlassToggle(props: GlassToggleProps): React.JSX.Element | null;

export interface GlassToggleGroupProps {
  items?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  multiple?: boolean;
  label?: string;
  size?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassToggleGroup(props: GlassToggleGroupProps): React.JSX.Element | null;

export interface GlassNavMenuProps {
  brand?: any;
  items?: any;
  actions?: React.ReactNode;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassNavMenu(props: GlassNavMenuProps): React.JSX.Element | null;

export interface GlassVideoPlayerProps {
  src?: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassVideoPlayer(props: GlassVideoPlayerProps): React.JSX.Element | null;

export interface GlassCarouselProps {
  slides?: any;
  render?: any;
  perView?: any;
  loop?: boolean;
  autoPlay?: boolean;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassCarousel(props: GlassCarouselProps): React.JSX.Element | null;

export interface GlassSpinnerProps {
  variant?: string;
  size?: string;
  tone?: string;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassSpinner(props: GlassSpinnerProps): React.JSX.Element | null;

export interface GlassKbdProps {
  keys?: any;
  live?: boolean;
  size?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassKbd(props: GlassKbdProps): React.JSX.Element | null;
