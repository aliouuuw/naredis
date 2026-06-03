"use client";

import { createContext, useContext } from "react";
import type { FormSuggestions } from "@/lib/modules/form-suggestions/service";

const OrgFormSuggestionsContext = createContext<FormSuggestions | null>(null);

export function OrgFormSuggestionsProvider({
  suggestions,
  children,
}: {
  suggestions: FormSuggestions;
  children: React.ReactNode;
}) {
  return (
    <OrgFormSuggestionsContext.Provider value={suggestions}>
      {children}
    </OrgFormSuggestionsContext.Provider>
  );
}

export function useOrgFormSuggestionsContext(): FormSuggestions | null {
  return useContext(OrgFormSuggestionsContext);
}
