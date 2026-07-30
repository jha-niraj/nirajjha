"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth/client";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [show, setShow] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	async function submit(e: React.FormEvent) {
		e.preventDefault();
		setPending(true);
		setError(null);

		const { error: authError } = await signIn.email({ email, password });

		if (authError) {
			// Deliberately vague. Distinguishing "no such user" from "wrong
			// password" tells an attacker which half they got right.
			setError("Those details did not work.");
			setPending(false);
			return;
		}

		router.replace("/admin/overview");
		router.refresh();
	}

	return (
		<motion.form
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			onSubmit={submit}
			className="w-full max-w-sm rounded-2xl border border-border bg-card p-7"
		>
			<span className="flex size-10 items-center justify-center rounded-full border border-border text-muted-foreground">
				<Lock className="size-4" />
			</span>
			<h1 className="mt-4 text-lg font-semibold tracking-tight">Admin</h1>
			<p className="mt-1 text-sm text-muted-foreground">
				Private dashboard for nirajjha.in
			</p>

			<div className="mt-6 space-y-4">
				<div>
					<Label htmlFor="email">Email</Label>
					<Input
						id="email"
						type="email"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						autoComplete="username"
						required
						className="mt-1.5"
					/>
				</div>

				<div>
					<Label htmlFor="password">Password</Label>
					<div className="relative mt-1.5">
						<Input
							id="password"
							type={show ? "text" : "password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="current-password"
							required
							className="pr-10"
						/>
						<button
							type="button"
							onClick={() => setShow((v) => !v)}
							aria-label={show ? "Hide password" : "Show password"}
							className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
						>
							{show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
						</button>
					</div>
				</div>
			</div>

			{error && (
				<p role="alert" className="mt-4 text-sm font-medium text-destructive">
					{error}
				</p>
			)}

			<button
				type="submit"
				disabled={pending}
				className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-85 disabled:opacity-50"
			>
				{pending && <Loader2 className="size-4 animate-spin" />}
				Sign in
			</button>
		</motion.form>
	);
}
