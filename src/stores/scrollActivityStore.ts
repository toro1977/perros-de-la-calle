import { create } from 'zustand';

// Lets the floating tab bar react to feed scrolling without prop-drilling
// scroll handlers through every screen that renders it.
type ScrollActivityState = {
  isScrolling: boolean;
  setScrolling: (value: boolean) => void;
};

export const useScrollActivityStore = create<ScrollActivityState>(set => ({
  isScrolling: false,
  setScrolling: value => set({ isScrolling: value }),
}));
