import { Button } from '#/components/ui/button'
import { Card } from '#/components/ui/card'
import { Input } from '#/components/ui/input'
import { authClient } from '#/lib/auth'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const session = authClient.useSession()

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-4">
      <p>Hello!</p>
      <p className="text-sm text-muted-foreground">
        {session.data?.user
          ? `Signed in as ${session.data.user.email}`
          : 'Not signed in'}
      </p>
      <Input />
      <Button variant={"accent"}>Hello</Button>
      <Button variant={"destructive"}>Hello</Button>
      <Button asChild>
        <Link to="/auth">{session.data?.user ? 'Account' : 'Sign in'}</Link>
      </Button>

    </main>
  )
}
