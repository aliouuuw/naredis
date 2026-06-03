"use client";

import { useEffect, useState } from "react";
import { useOrgFormSuggestionsContext } from "@/components/providers/org-form-suggestions-provider";
import {
  getCustomerFormSuggestionsAction,
  getOrgFormSuggestionsAction,
} from "@/lib/actions/form-suggestions";
import type { FormSuggestions } from "@/lib/modules/form-suggestions/service";

export function useOrgFormSuggestions(enabled = true) {
  const fromContext = useOrgFormSuggestionsContext();
  const [suggestions, setSuggestions] = useState<FormSuggestions | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || fromContext) return;
    let cancelled = false;
    setLoading(true);
    void getOrgFormSuggestionsAction().then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (result.ok && result.data) {
        setSuggestions(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, fromContext]);

  return {
    suggestions: fromContext ?? suggestions,
    loading: fromContext ? false : loading,
  };
}

export function useCustomerFormSuggestions(
  customerId: string | undefined,
  enabled = true,
  initialLabels?: string[],
) {
  const [customerSuggestions, setCustomerSuggestions] = useState<{
    ledgerLabels: string[];
  } | null>(
    initialLabels ? { ledgerLabels: initialLabels } : null,
  );

  useEffect(() => {
    if (initialLabels) {
      setCustomerSuggestions({ ledgerLabels: initialLabels });
      return;
    }
    if (!enabled || !customerId) {
      setCustomerSuggestions(null);
      return;
    }
    let cancelled = false;
    void getCustomerFormSuggestionsAction(customerId).then((result) => {
      if (cancelled) return;
      if (result.ok && result.data) {
        setCustomerSuggestions(result.data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [customerId, enabled, initialLabels]);

  return customerSuggestions;
}
