import * as React from "react";

export interface GlassSoundsProps {
  on?: any;
  volume?: any;
  typing?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassSounds(props: GlassSoundsProps): React.JSX.Element | null;

export declare function useGlassSound(...args: any[]): any;

export declare const glassSound: any;
