import * as React from "react";

export interface GlassSceneProps {
  material?: any;
  appearance?: any;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassScene(props: GlassSceneProps): React.JSX.Element | null;

export interface GlassContentProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassContent(props: GlassContentProps): React.JSX.Element | null;

export interface GlassSurfaceProps {
  as?: any;
  interactive?: any;
  radius?: any;
  material?: any;
  className?: string;
  style?: any;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function GlassSurface(props: GlassSurfaceProps): React.JSX.Element | null;

export interface GlassBackdropProps {
  src?: string;
  video?: any;
  poster?: string;
  alt?: any;
  appearance?: any;
  shiftY?: any;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassBackdrop(props: GlassBackdropProps): React.JSX.Element | null;

export interface LoopVideoProps {
  src?: string;
  poster?: string;
  className?: string;
  onFail?: (...args: any[]) => void;
  children?: React.ReactNode;
  [key: string]: any;
}
export declare function LoopVideo(props: LoopVideoProps): React.JSX.Element | null;
