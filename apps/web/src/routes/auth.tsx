
import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHead } from '#/components/ui/card';

export const Route = createFileRoute('/auth')({
  component: AuthLayout,
})

function AuthLayout() {

  return (
    <main className="flex min-h-screen items-center border justify-center gap-6">
      <div className="w-2/5">
        <div className="max-w-10/12 mx-auto">
          <img src="/logo.png" className='size-12 border-border border mb-2' />
          <Outlet />
        </div>
      </div>
      <div className=' w-3/5 h-screen flex-1'>
        <Card variant='checkered' className='w-full flex items-center justify-center h-full rounded-none' >

          <Card variant='frosted' className='w-100 h-150 bg-transparent backdrop-blur-lg border-hairline border'>
            <CardHead variant='black' title={"Font Example"}/>
            <CardContent>
              <img src="/splash.webp" className="border" alt="" />
            </CardContent>
          </Card>

        </Card>

      </div>

    </main>
  )
}


