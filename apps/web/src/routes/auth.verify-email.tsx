import { EmailVerification } from '#/features/auth/otp/containers/email-verification'
import { createFileRoute } from '@tanstack/react-router'
import * as v from 'valibot'

const SearchSchema = v.object({
  email: v.pipe(v.string(), v.email()),
})

export const Route = createFileRoute('/auth/verify-email')({
  validateSearch: (search) => v.parse(SearchSchema, search),
  component: VerifyEmailRoute,
})

function VerifyEmailRoute() {
  const { email } = Route.useSearch()

  return <EmailVerification email={email} />
}
