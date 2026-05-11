import { redirect } from "next/navigation";

export default function Home() {
  // ⚡ Langsung lempar user ke halaman login pas buka web
  redirect("/login");
}