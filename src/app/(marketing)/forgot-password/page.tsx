import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Reset the password for your Hector 1984 wholesale account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
