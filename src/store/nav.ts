'use client'

import { create } from 'zustand'

export type View =
  | { name: 'home' }
  | { name: 'browse'; category?: string; q?: string }
  | { name: 'listing'; id: string }
  | { name: 'post' }
  | { name: 'account' }
  | { name: 'profile'; userId: string }

interface NavState {
  view: View
  regionId: string | null
  history: View[]
  go: (view: View) => void
  back: () => void
  setRegion: (id: string) => void
}

export const useNav = create<NavState>((set) => ({
  view: { name: 'home' },
  regionId: null,
  history: [],
  go: (view) =>
    set((s) => ({
      history: [...s.history, s.view],
      view,
    })),
  back: () =>
    set((s) => {
      if (s.history.length === 0) return { view: { name: 'home' }, history: [] }
      const history = [...s.history]
      const view = history.pop()!
      return { view, history }
    }),
  setRegion: (id) => set({ regionId: id, view: { name: 'home' }, history: [] }),
}))

// Persist region to localStorage + restore
if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('bulletin:region')
  if (saved) {
    useNav.setState({ regionId: saved })
  }
  useNav.subscribe((s) => {
    if (s.regionId) localStorage.setItem('bulletin:region', s.regionId)
  })
}
