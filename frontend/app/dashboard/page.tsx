import { redirect } from "next/navigation";

// Dashboard split into role areas — send legacy links to the maintainer view.
export default function DashboardPage() {
  redirect("/maintainer");
}
