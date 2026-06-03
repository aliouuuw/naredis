"use client";

import { useEffect, useState } from "react";
import {
  getCustomerFormSuggestionsAction,
  getOrgFormSuggestionsAction,
} from "@/lib/actions/form-suggestions";
import type { FormSuggestions } from "@/lib/modules/form-suggestions/service";

export function useOrgFormSuggestions(enabled = true) {
  const [suggestions, setSuggestions] = useState<FormSuggestions | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
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
  }, [enabled]);

  return { suggestions, loading };
}

export function useCustomerFormSuggestions(
  customerId: string | undefined,
  enabled = true,
) {
  const [customerSuggestions, setCustomerSuggestions] = useState<{
    ledgerLabels: string[];
  } | null>(null);

  useEffect(() => {
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
  }, [customerId, enabled]);

  return customerSuggestions;
}
