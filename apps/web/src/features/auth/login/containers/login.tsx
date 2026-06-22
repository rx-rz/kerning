import { Form, Field as FormischField } from "@formisch/react";
import { Button } from "#/components/ui/button";
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { PendingButtonContent } from "../../components/pending-button-content";
import { useLoginForm } from "../form/login-form";

export function LoginForm() {
	const { loginForm, handleSubmit, error, isPending } = useLoginForm();

	return (
		<Form className="space-y-8" of={loginForm} onSubmit={handleSubmit}>
			<FormischField of={loginForm} path={["email"]}>
				{(field) => (
					<Field data-invalid={field.errors !== null}>
						<FieldLabel htmlFor="login-email">Work Email</FieldLabel>
						<Input
							{...field.props}
							autoComplete="email"
							id="login-email"
							inputMode="email"
							type="email"
							value={field.input ?? ""}
						/>
						{field.errors ? (
							<FieldError
								errors={field.errors.map((message) => ({ message }))}
							/>
						) : null}
					</Field>
				)}
			</FormischField>

			<FormischField of={loginForm} path={["password"]}>
				{(field) => (
					<Field data-invalid={field.errors !== null}>
						<FieldLabel htmlFor="login-password">Password</FieldLabel>
						<Input
							{...field.props}
							autoComplete="current-password"
							id="login-password"
							type="password"
							value={field.input ?? ""}
						/>
						{field.errors ? (
							<FieldError
								errors={field.errors.map((message) => ({ message }))}
							/>
						) : null}
					</Field>
				)}
			</FormischField>

			{error ? <p className="text-sm text-destructive">{error}</p> : null}

			<Button className="w-full mt-3 p-6" disabled={isPending}>
				<PendingButtonContent
					idleText="Sign in"
					isPending={isPending}
					pendingText="Signing in"
				/>
			</Button>
		</Form>
	);
}
