import { useWindowDimensions } from 'react-native';

export type Breakpoint = 'phone' | 'tablet-portrait' | 'tablet-landscape';

export interface BreakpointInfo {
  breakpoint: Breakpoint;
  isPhone: boolean;
  isTablet: boolean;
  isTabletPortrait: boolean;
  isTabletLandscape: boolean;
  width: number;
  height: number;
}

export const useBreakpoint = (): BreakpointInfo => {
  const { width, height } = useWindowDimensions();

  let breakpoint: Breakpoint = 'phone';
  if (width >= 900) {
    breakpoint = 'tablet-landscape';
  } else if (width >= 600) {
    breakpoint = 'tablet-portrait';
  }

  const isPhone = breakpoint === 'phone';
  const isTabletPortrait = breakpoint === 'tablet-portrait';
  const isTabletLandscape = breakpoint === 'tablet-landscape';
  const isTablet = isTabletPortrait || isTabletLandscape;

  return {
    breakpoint,
    isPhone,
    isTablet,
    isTabletPortrait,
    isTabletLandscape,
    width,
    height,
  };
};
