import Link from "next/link";
import { productBrand } from "@/lib/branding";
import { cn } from "@/lib/utils";

type ProductMarkProps = {
  /** Show product name beside the monogram */
  showName?: boolean;
  /** Inverted panel (login left column) */
  variant?: "default" | "inverted";
  href?: string;
  className?: string;
  nameClassName?: string;
};

const markSizes = {
  sm: "size-8 text-xs",
  md: "size-11 text-sm",
} as const;

export function ProductMark({
  showName = true,
  variant = "default",
  href,
  className,
  nameClassName,
  size = "sm",
}: ProductMarkProps & { size?: keyof typeof markSizes }) {
  const inverted = variant === "inverted";

  const mark = (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md font-semibold tracking-tight",
        markSizes[size],
        inverted
          ? "border border-background/20 bg-background/10 text-background"
          : "bg-primary text-primary-foreground",
        size === "md" && "rounded-xl",
      )}
      aria-hidden={showName ? undefined : true}
    >
      {productBrand.monogram}
    </span>
  );

  const label = showName ? (
    <span
      className={cn(
        "font-semibold tracking-tight",
        size === "md" ? "text-xl" : "text-sm",
        inverted ? "text-background" : "text-foreground",
        nameClassName,
      )}
    >
      {productBrand.name}
    </span>
  ) : null;

  const content = (
    <>
      {mark}
      {label}
    </>
  );

  const rootClass = cn(
    "flex items-center gap-2.5",
    href && "rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={rootClass}>
        {content}
      </Link>
    );
  }

  return <div className={rootClass}>{content}</div>;
}

export function ProductMarkBlock({
  variant = "default",
  className,
}: {
  variant?: "default" | "inverted";
  className?: string;
}) {
  const inverted = variant === "inverted";

  if (!inverted) {
    return (
      <div className={cn("space-y-1", className)}>
        <ProductMark variant={variant} size="md" showName />
        <p className="text-sm text-muted-foreground">
          {productBrand.taglineShort}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Structural framing marks — architectural crosshairs */}
      <div className="absolute -left-5 -top-5 text-background/[0.08]" aria-hidden>
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
          <line x1="36" y1="0" x2="36" y2="72" stroke="currentColor" strokeWidth="0.5" />
          <line x1="0" y1="36" x2="72" y2="36" stroke="currentColor" strokeWidth="0.5" />
          <circle cx="36" cy="36" r="20" stroke="currentColor" strokeWidth="0.5" strokeDasharray="3 4" />
          {/* Corner brackets */}
          <path d="M 8 16 L 8 8 L 16 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <path d="M 56 8 L 64 8 L 64 16" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <path d="M 8 56 L 8 64 L 16 64" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          <path d="M 56 64 L 64 64 L 64 56" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
        </svg>
      </div>

      {/* Monogram — customs stamp / seal treatment */}
      <div className="login-panel-enter login-panel-enter-1 relative inline-flex">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-background/25 bg-background/[0.04] text-[17px] font-bold tracking-tight text-background">
          {productBrand.monogram}
        </span>
      </div>

      {/* Brand name — display scale, tight leading */}
      <div className="login-panel-enter login-panel-enter-2 mt-5">
        <h1 className="text-[2.5rem] font-semibold leading-[0.95] tracking-[-0.04em] text-background">
          {productBrand.name}
        </h1>
      </div>

      {/* Tagline — medium weight, architectural */}
      <div className="login-panel-enter login-panel-enter-3 mt-3 max-w-[15rem]">
        <p className="text-[15px] font-medium leading-snug text-background/55">
          {productBrand.taglineShort}
        </p>
      </div>
    </div>
  );
}
