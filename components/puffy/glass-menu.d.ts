import * as React from "react";

export declare function usePopover(...args: any[]): any;

export declare function moveIndex(...args: any[]): any;

export interface GlassListProps {
  id?: string;
  role?: any;
  effect?: string;
  align?: string;
  items?: any;
  activeIndex?: any;
  onActiveChange?: (...args: any[]) => void;
  onPick?: (...args: any[]) => void;
  selectedValue?: any;
  labelledBy?: any;
  empty?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassList(props: GlassListProps): React.JSX.Element | null;

export declare function listKey(...args: any[]): any;

export declare const Chevron: any;
