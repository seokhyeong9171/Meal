import type { Metadata } from "next";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "식단표 관리",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminClient />;
}
