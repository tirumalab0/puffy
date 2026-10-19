import * as React from "react";

export interface GlassDatePickerProps {
  value?: any;
  onChange?: (...args: any[]) => void;
  label?: string;
  placeholder?: string;
  min?: any;
  max?: any;
  hint?: string;
  clearable?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassDatePicker(props: GlassDatePickerProps): React.JSX.Element | null;

export interface GlassKanbanProps {
  columns?: any;
  onChange?: (...args: any[]) => void;
  onAdd?: (...args: any[]) => void;
  label?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassKanban(props: GlassKanbanProps): React.JSX.Element | null;

export interface GlassFiltersProps {
  facets?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  query?: any;
  onQuery?: (...args: any[]) => void;
  count?: any;
  placeholder?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassFilters(props: GlassFiltersProps): React.JSX.Element | null;

export interface GlassPricingProps {
  plans?: any;
  billing?: any;
  onBilling?: (...args: any[]) => void;
  onSelect?: (...args: any[]) => void;
  currency?: string;
  saveLabel?: string;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassPricing(props: GlassPricingProps): React.JSX.Element | null;

export interface GlassWorkspaceSwitcherProps {
  workspaces?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  onCreate?: (...args: any[]) => void;
  user?: any;
  onAction?: (...args: any[]) => void;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassWorkspaceSwitcher(props: GlassWorkspaceSwitcherProps): React.JSX.Element | null;
