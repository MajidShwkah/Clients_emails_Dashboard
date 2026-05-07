import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — RIME Email Routing" };

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-muted/30 px-4 py-12">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
