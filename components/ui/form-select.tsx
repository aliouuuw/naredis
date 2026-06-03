"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export type FormSelectOption = { value: string; label: string };

export type FormSelectGroup = {
  label: string;
  options: FormSelectOption[];
};

type FormSelectProps = {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options?: FormSelectOption[];
  groups?: FormSelectGroup[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  triggerClassName?: string;
  size?: "sm" | "default";
  /** Renders a clearable empty choice (value ""). */
  emptyOption?: string;
  "aria-label"?: string;
};

export function FormSelect({
  id,
  name,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  options = [],
  groups,
  placeholder,
  disabled,
  required,
  className,
  triggerClassName,
  size = "default",
  emptyOption,
  "aria-label": ariaLabel,
}: FormSelectProps) {
  const isControlled = valueProp !== undefined;
  const [internal, setInternal] = React.useState(defaultValue);
  const value = isControlled ? valueProp : internal;

  React.useEffect(() => {
    if (!isControlled) {
      setInternal(defaultValue);
    }
  }, [defaultValue, isControlled]);

  function handleChange(next: string | null) {
    const v = next ?? "";
    if (!isControlled) {
      setInternal(v);
    }
    onValueChange?.(v);
  }

  const selectValue = value.length > 0 ? value : null;

  const flatOptions = React.useMemo(() => {
    if (groups) {
      return groups.flatMap((g) => g.options);
    }
    return options;
  }, [groups, options]);

  const selectedLabel = flatOptions.find((o) => o.value === value)?.label;

  return (
    <div className={cn("w-full min-w-0", className)}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <Select
        value={selectValue}
        onValueChange={handleChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger
          id={id}
          size={size}
          className={cn("w-full", triggerClassName)}
          aria-required={required}
          aria-label={ariaLabel}
        >
          <SelectValue placeholder={placeholder}>
            {selectedLabel ?? null}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {emptyOption !== undefined ? (
            <SelectItem value="">{emptyOption}</SelectItem>
          ) : null}
          {groups
            ? groups.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))
            : options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
        </SelectContent>
      </Select>
    </div>
  );
}
