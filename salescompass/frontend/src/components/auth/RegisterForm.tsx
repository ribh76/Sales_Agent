"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { Input } from "@/components/ui/Input";

export function RegisterForm() {
  const router = useRouter();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signUp({ full_name: fullName, email, password });
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-md">
      <form className="grid gap-4" onSubmit={onSubmit}>
        <div>
          <h1 className="text-xl font-semibold">Create account</h1>
          <p className="mt-1 text-sm text-neutral-600">Start a focused ICP workflow.</p>
        </div>
        <ErrorMessage message={error} />
        <Input label="Full name" value={fullName} onChange={(event) => setFullName(event.target.value)} />
        <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        <Input
          label="Password"
          type="password"
          minLength={8}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <Button type="submit" disabled={loading} icon={<UserPlus aria-hidden className="h-4 w-4" />}>
          {loading ? "Creating" : "Create account"}
        </Button>
        <p className="text-sm text-neutral-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-signal">
            Sign in
          </Link>
        </p>
      </form>
    </Card>
  );
}

