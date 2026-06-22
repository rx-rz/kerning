import { LoginForm } from '#/features/auth/login/containers/login'
import { OauthContainer } from '#/features/auth/signup/containers/oauth'
import { APP_ROUTES } from '#/lib/app-routes'
import { createFileRoute, Link } from '@tanstack/react-router'
import * as v from 'valibot'

const SearchSchema = v.object({
  oauth_error: v.optional(v.string()),
})

const oauthErrorMessages: Record<string, string> = {
  access_denied: 'OAuth access was denied.',
  account_not_linked: 'This social account is not linked to a Kerning account.',
  invalid_request: 'The OAuth request could not be completed.',
}

export const Route = createFileRoute('/auth/login')({
  validateSearch: (search) => v.parse(SearchSchema, search),
  component: LoginRoute,
})

function LoginRoute() {
  const { oauth_error } = Route.useSearch()
  const oauthError = oauth_error
    ? (oauthErrorMessages[oauth_error] ?? 'OAuth sign in could not be completed.')
    : null

  return (
    <div className="space-y-6 mx-auto">
      {oauthError ? <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{oauthError}</p> : null}
      <h1 className='text-2xl font-bold mb-12'>Sign In</h1>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        or
      </p>
      <OauthContainer />
      <p className='text-center'>Don't have an account? <Link to={APP_ROUTES.SIGNUP} viewTransition className='text-primary underline'>Sign up</Link></p>
    </div>
  )
}
