import { redirect } from "next/navigation";

/** Deep links open the list with the fiche sheet (Notion-style). */
export default async function DeclarationFicheRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/declarations?open=${id}`);
}
