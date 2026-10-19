import * as React from "react";

export interface GlassColorPickerProps {
  value?: any;
  onChange?: (...args: any[]) => void;
  swatches?: any;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassColorPicker(props: GlassColorPickerProps): React.JSX.Element | null;

export interface GlassImageViewerProps {
  images?: any;
  columns?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassImageViewer(props: GlassImageViewerProps): React.JSX.Element | null;

export interface GlassFileTreeProps {
  tree?: any;
  value?: any;
  onSelect?: (...args: any[]) => void;
  defaultOpen?: boolean;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassFileTree(props: GlassFileTreeProps): React.JSX.Element | null;

export interface GlassMarqueeProps {
  children?: React.ReactNode;
  speed?: any;
  reverse?: any;
  pauseOnHover?: any;
  gap?: any;
  label?: string;
  className?: string;
  [key: string]: any;
}
export declare function GlassMarquee(props: GlassMarqueeProps): React.JSX.Element | null;

export interface GlassTiltCardProps {
  children?: React.ReactNode;
  max?: any;
  glare?: any;
  scale?: any;
  className?: string;
  [key: string]: any;
}
export declare function GlassTiltCard(props: GlassTiltCardProps): React.JSX.Element | null;

export interface GlassPullToRefreshProps {
  onRefresh?: (...args: any[]) => void;
  children?: React.ReactNode;
  height?: any;
  threshold?: any;
  className?: string;
  [key: string]: any;
}
export declare function GlassPullToRefresh(props: GlassPullToRefreshProps): React.JSX.Element | null;

export interface GlassCylinderProps {
  items?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  width?: any;
  height?: any;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassCylinder(props: GlassCylinderProps): React.JSX.Element | null;

export interface GlassThemeToggleProps {
  value?: any;
  onChange?: (...args: any[]) => void;
  size?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassThemeToggle(props: GlassThemeToggleProps): React.JSX.Element | null;

export interface GlassHoverHighlightProps {
  items?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  direction?: any;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassHoverHighlight(props: GlassHoverHighlightProps): React.JSX.Element | null;

export interface GlassMorphSearchProps {
  items?: any;
  onPick?: (...args: any[]) => void;
  placeholder?: string;
  width?: any;
  hotkey?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassMorphSearch(props: GlassMorphSearchProps): React.JSX.Element | null;

export interface GlassOverflowActionsProps {
  actions?: React.ReactNode;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassOverflowActions(props: GlassOverflowActionsProps): React.JSX.Element | null;

export interface GlassCardFolderProps {
  name?: string;
  meta?: string;
  cards?: any;
  color?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassCardFolder(props: GlassCardFolderProps): React.JSX.Element | null;

export interface GlassSchedulerProps {
  days?: any;
  from?: any;
  to?: any;
  step?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassScheduler(props: GlassSchedulerProps): React.JSX.Element | null;

export interface GlassMasonryProps {
  items?: any;
  loadMore?: any;
  hasMore?: any;
  columns?: any;
  gap?: any;
  height?: any;
  render?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassMasonry(props: GlassMasonryProps): React.JSX.Element | null;

export interface GlassWalletCardProps {
  brand?: any;
  name?: string;
  last4?: any;
  expiry?: any;
  balance?: any;
  network?: any;
  tone?: string;
  tone2?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassWalletCard(props: GlassWalletCardProps): React.JSX.Element | null;

export interface GlassNotFoundProps {
  code?: any;
  title?: string;
  text?: string;
  art?: any;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassNotFound(props: GlassNotFoundProps): React.JSX.Element | null;
