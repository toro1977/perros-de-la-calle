import { create } from 'zustand';

// Lets the tab bar switch the feed between list/map without a route
// change — Mapa isn't its own screen, just another view of "/".
type FeedViewState = {
  viewMode: 'list' | 'map';
  setViewMode: (mode: 'list' | 'map') => void;
};

export const useFeedViewStore = create<FeedViewState>(set => ({
  viewMode: 'list',
  setViewMode: mode => set({ viewMode: mode }),
}));
