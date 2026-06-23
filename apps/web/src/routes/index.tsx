import { Button } from '#/components/ui/button'
import { APP_ROUTES } from '#/lib/app-routes'
import { authClient } from '#/lib/auth'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'

export const Route = createFileRoute('/')({ component: App })

function App() {
  const session = authClient.useSession()

  return (
    <main className=" border border-y-0 min-h-screen flex">
      <div className='w-42 p-4'>
        <img src="/logo.png" alt="Logo" className="size-8" />
        <div className="mt-6">
          <Button className='flex gap-1 w-full items-center'><Plus />  New Project</Button>
          <div className="space-y-6 mt-4">
            <Link to={APP_ROUTES.DASHBOARD} className="p-2 rounded-md block active:bg-accent/40 w-full text-center hover:bg-accent/40">
              Dashboard
            </Link>
          </div>
        </div>
      </div>
      <div className='flex-1 px-8 py-4 border w-full'>
        <h1 className='text-3xl font-bold mb-1'>Create a new project</h1>
        <p className='text-muted-foreground text-lg'>Create your first project to get started</p>
      </div>
    </main>
  )
}
