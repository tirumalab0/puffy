import * as React from "react";

export interface GlassNumberProps {
  value?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassNumber(props: GlassNumberProps): React.JSX.Element | null;

export interface GlassRevealProps {
  text?: string;
  as?: any;
  step?: any;
  delay?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassReveal(props: GlassRevealProps): React.JSX.Element | null;

export interface GlassArtProps {
  tone?: string;
  lines?: any;
  still?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassArt(props: GlassArtProps): React.JSX.Element | null;
