import * as React from "react";

export interface GlassSwitchProps {
  checked?: boolean;
  onChange?: (...args: any[]) => void;
  label?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassSwitch(props: GlassSwitchProps): React.JSX.Element | null;

export interface GlassCheckboxProps {
  checked?: boolean;
  onChange?: (...args: any[]) => void;
  label?: string;
  hint?: string;
  disabled?: boolean;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassCheckbox(props: GlassCheckboxProps): React.JSX.Element | null;

export interface GlassCheckboxGroupProps {
  label?: string;
  options?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassCheckboxGroup(props: GlassCheckboxGroupProps): React.JSX.Element | null;

export interface GlassRadioGroupProps {
  label?: string;
  options?: any;
  value?: any;
  onChange?: (...args: any[]) => void;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassRadioGroup(props: GlassRadioGroupProps): React.JSX.Element | null;

export interface GlassSliderProps {
  value?: any;
  onChange?: (...args: any[]) => void;
  min?: any;
  max?: any;
  step?: any;
  label?: string;
  unit?: string;
  showValue?: boolean;
  sound?: boolean;
  children?: React.ReactNode;
  className?: string;
  [key: string]: any;
}
export declare function GlassSlider(props: GlassSliderProps): React.JSX.Element | null;
