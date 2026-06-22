import { SignupForm } from '#/features/auth/signup/containers/signup'
import { OauthContainer } from '#/features/auth/signup/containers/oauth'
import { createFileRoute, Link, useRouterState } from '@tanstack/react-router'
import { APP_ROUTES } from '#/lib/app-routes'

export const Route = createFileRoute('/auth/signup')({
  component: SignupRoute,
})

function SignupRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  return (
    <div className="space-y-6  mx-auto">
      <h1 className='text-2xl font-bold mb-12'>Sign up</h1>
      <SignupForm />
      <p className="text-center text-sm text-muted-foreground">
        or
      </p>
      <OauthContainer />
      <p className='text-center'>Already have an account? <Link to={APP_ROUTES.LOGIN} viewTransition className='text-primary underline'>Log in</Link></p>
    </div>
  )
}
