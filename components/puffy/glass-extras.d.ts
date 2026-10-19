import * as React from "react";

export interface GlassWheelPickerProps {
  columns?: any;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassWheelPicker(props: GlassWheelPickerProps): React.JSX.Element | null;

export interface GlassSortableListProps {
  items?: any;
  onChange?: (...args: any[]) => void;
  render?: any;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassSortableList(props: GlassSortableListProps): React.JSX.Element | null;

export interface GlassMultiSelectProps {
  options?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  label?: string;
  placeholder?: string;
  max?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassMultiSelect(props: GlassMultiSelectProps): React.JSX.Element | null;

export interface GlassContextMenuProps {
  items?: any;
  children?: React.ReactNode;
  label?: string;
  className?: string;
  [key: string]: any;
}
export declare function GlassContextMenu(props: GlassContextMenuProps): React.JSX.Element | null;

export interface GlassMorphModalProps {
  label?: string;
  icon?: React.ReactNode;
  title?: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  width?: any;
  className?: string;
  [key: string]: any;
}
export declare function GlassMorphModal(props: GlassMorphModalProps): React.JSX.Element | null;

export interface GlassExpandTabsProps {
  tabs?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassExpandTabs(props: GlassExpandTabsProps): React.JSX.Element | null;

export interface GlassBloomMenuProps {
  items?: any;
  label?: string;
  spread?: any;
  radius?: any;
  dir?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassBloomMenu(props: GlassBloomMenuProps): React.JSX.Element | null;

export interface GlassFileDiffProps {
  file?: any;
  lines?: any;
  start?: any;
  streaming?: any;
  speed?: any;
  onDone?: (...args: any[]) => void;
  defaultOpen?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassFileDiff(props: GlassFileDiffProps): React.JSX.Element | null;

export interface GlassToolApprovalProps {
  tool?: any;
  action?: React.ReactNode;
  target?: any;
  details?: any;
  risk?: any;
  onDecide?: (...args: any[]) => void;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassToolApproval(props: GlassToolApprovalProps): React.JSX.Element | null;

export interface GlassThinkingPhrasesProps {
  phrases?: any;
  interval?: any;
  running?: any;
  showTime?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassThinkingPhrases(props: GlassThinkingPhrasesProps): React.JSX.Element | null;

export declare const XP: any;
