import { ButtonLink } from "@/components/ui/button";

type ListCrossLinksProps = {
  links: { href: string; label: string }[];
};

/** Secondary navigation between related list pages (declarations ↔ dossiers ↔ clients ↔ transactions). */
export function ListCrossLinks({ links }: ListCrossLinksProps) {
  if (links.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {links.map((link) => (
        <ButtonLink
          key={link.href}
          href={link.href}
          variant="outline"
          className="rounded-full px-4"
        >
          {link.label}
        </ButtonLink>
      ))}
    </div>
  );
}
