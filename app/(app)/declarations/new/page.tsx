import { redirect } from "next/navigation";

export default function NewDeclarationPage() {
  redirect("/declarations?new=1");
}
