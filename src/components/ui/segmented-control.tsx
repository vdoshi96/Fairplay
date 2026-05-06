type SegmentedControlOption<T extends string> = {
  label: string;
  value: T;
};

type SegmentedControlProps<T extends string> = {
  ariaLabel: string;
  className?: string;
  onChange: (value: T) => void;
  options: SegmentedControlOption<T>[];
  value: T;
};

export function SegmentedControl<T extends string>({
  ariaLabel,
  className,
  onChange,
  options,
  value
}: SegmentedControlProps<T>) {
  return (
    <div
      aria-label={ariaLabel}
      className={[
        "inline-flex max-w-full gap-1 overflow-hidden rounded border border-[var(--fp-line)] bg-[var(--fp-surface)] p-1",
        className
      ]
        .filter(Boolean)
        .join(" ")}
      role="group"
    >
      {options.map((option) => {
        const isSelected = option.value === value;

        return (
          <button
            aria-pressed={isSelected}
            className={[
              "min-h-9 min-w-16 rounded px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--fp-focus)]",
              isSelected
                ? "bg-fp-primary text-fp-on-primary shadow-[var(--fp-shadow-soft)]"
                : "text-[var(--fp-muted)] hover:bg-[var(--fp-surface-strong)] hover:text-[var(--fp-ink)]"
            ].join(" ")}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
