import { Button } from '#/components/ui/button'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  head: () => ({ meta: [{ title: 'About Kerning' }] }),
  component: About,
})

function About() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col justify-center px-4 py-12">
      <section className="border-y border-border py-10 sm:py-14">
        <p className="font-mono text-xs font-semibold text-primary">About Kerning</p>
        <h1 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-[-0.035em] text-foreground sm:text-6xl">
          Better type decisions need better tools.
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">
          Kerning is a focused workspace for comparing fonts, inspecting glyphs,
          testing real content, and turning type choices into working visual systems.
        </p>
        <Button asChild className="mt-8">
          <Link to="/">Back to home</Link>
        </Button>
      </section>
    </main>
  )
}
