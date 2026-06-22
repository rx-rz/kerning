import { Form, Field as FormischField } from "@formisch/react";
import type { ComponentProps, HTMLInputTypeAttribute } from "react";
import { Button } from "#/components/ui/button";
import { Field, FieldError, FieldLabel } from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { PendingButtonContent } from "../../components/pending-button-content";
import { useSignupForm } from "../form/signup-form";

const fields = [
	{
		path: ["name"] as const,
		id: "signup-name",
		label: "Name",
		autoComplete: "name",
		type: "text",
	},
	{
		path: ["email"] as const,
		id: "signup-email",
		label: "Work Email",
		autoComplete: "email",
		inputMode: "email",
		type: "email",
	},
	{
		path: ["password"] as const,
		id: "signup-password",
		label: "Password",
		autoComplete: "new-password",
		type: "password",
	},
	{
		path: ["confirmPassword"] as const,
		id: "signup-confirm-password",
		label: "Confirm Password",
		autoComplete: "new-password",
		type: "password",
	},
] satisfies Array<{
	path: ["name"] | ["email"] | ["password"] | ["confirmPassword"];
	id: string;
	label: string;
	autoComplete: string;
	inputMode?: ComponentProps<"input">["inputMode"];
	type: HTMLInputTypeAttribute;
}>;

export function SignupForm() {
	const { signupForm, handleSubmit, error, isPending } = useSignupForm();

	return (
		<Form className="space-y-8" of={signupForm} onSubmit={handleSubmit}>
			{fields.map((input) => (
				<FormischField key={input.id} of={signupForm} path={input.path}>
					{(field) => (
						<Field data-invalid={field.errors !== null}>
							<FieldLabel htmlFor={input.id}>{input.label}</FieldLabel>
							<Input
								{...field.props}
								autoComplete={input.autoComplete}
								id={input.id}
								inputMode={input.inputMode}
								type={input.type}
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
			))}

			{error ? <p className="text-sm text-destructive">{error}</p> : null}

			<Button
				className="w-full mt-3 p-6"
				variant={"accent"}
				disabled={isPending}
			>
				<PendingButtonContent
					idleText="Create Account"
					isPending={isPending}
					pendingText="Creating your account"
				/>
			</Button>
		</Form>
	);
}
