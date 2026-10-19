import * as React from "react";

export interface GlassFurMascotProps {
  color?: any;
  size?: string;
  layers?: any;
  length?: any;
  density?: any;
  eyes?: any;
  glow?: any;
  greet?: any;
  greetOnLoad?: any;
  tapToGreet?: any;
  hello?: any;
  onGreet?: (...args: any[]) => void;
  fallback?: React.ReactNode;
  label?: string;
  sound?: boolean;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassFurMascot(props: GlassFurMascotProps): React.JSX.Element | null;
