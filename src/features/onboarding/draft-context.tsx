import { createContext, useContext, useState, type ReactNode } from 'react';

import { DEFAULT_DRAFT, type OnboardingDraft } from './onboarding';

type Ctx = { draft: OnboardingDraft; update: (patch: Partial<OnboardingDraft>) => void };

const DraftContext = createContext<Ctx | null>(null);

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(DEFAULT_DRAFT);
  const update = (patch: Partial<OnboardingDraft>) => setDraft((d) => ({ ...d, ...patch }));
  return <DraftContext.Provider value={{ draft, update }}>{children}</DraftContext.Provider>;
}

export function useDraft(): Ctx {
  const ctx = useContext(DraftContext);
  if (!ctx) throw new Error('useDraft must be used inside DraftProvider');
  return ctx;
}
