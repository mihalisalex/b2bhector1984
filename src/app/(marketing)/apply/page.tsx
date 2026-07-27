import type { Metadata } from "next";
import { ApplyForm } from "@/components/auth/ApplyForm";

export const metadata: Metadata = {
  title: "Apply for Wholesale Access",
  description:
    "Apply for a Hector 1984 wholesale account. Tell us about your store — resale certificate, expected volume, and location. Most applications are reviewed within 2 business days.",
};

export default function ApplyPage() {
  return <ApplyForm />;
}
