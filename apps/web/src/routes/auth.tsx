import { Button } from '#/components/ui/button'
import { HalftoneDots } from '@paper-design/shaders-react';
import { authClient } from '#/lib/auth'
import { Link, Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'
import { LogOut } from 'lucide-react'

export const Route = createFileRoute('/auth')({
  component: AuthLayout,
})

function AuthLayout() {
  const session = authClient.useSession()
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const isSignup = pathname === '/auth/signup'

  return (
    <main className="flex min-h-screen p-4 items-center border justify-center gap-6">
      <div className="w-2/5">
        <div className="max-w-10/12 mx-auto">
          <img src="/logo.png" className='size-12 border-border border mb-2' />
          <Outlet />
        </div>
      </div>
      <div className=' w-3/5 h-[95vh] flex-1'>
        <HalftoneDots
          width="100%"
          height="100%"
          className='w-fit flex-1 rounded-lg  bg-contain'
          image="/splash.webp"
          colorBack="#b6b0ff"
          colorFront="#171717"
          originalColors={false}
          type="gooey"
          grid="hex"
          inverted={false}
          size={0.1}
          radius={1.25}
          contrast={0.4}
          grainMixer={0.2}
          grainOverlay={0.2}
          grainSize={0.5}
          fit="cover"
        />
      </div>

    </main>
  )
}

function SignedInPanel() {
  const session = authClient.useSession()

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-hairline bg-component-inset px-3 py-2 text-foreground">
        {session.data?.user.name}
      </div>
      <Button className="w-full" variant="outline" onClick={() => authClient.signOut()}>
        <LogOut />
        Sign out
      </Button>
    </div>
  )
}
