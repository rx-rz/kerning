import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: About,
})

function About() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-4 py-12">
      <section className="rounded-xl border border-hairline bg-surface p-6 shadow-frame backdrop-blur-sm sm:p-8">
        <p className="mb-2 text-[10px] font-medium uppercase tracking-normal text-faint">
          About
        </p>
        <h1 className="mb-3 text-4xl font-medium leading-tight text-foreground sm:text-5xl">
          A small starter with room to grow.
        </h1>
        <p className="m-0 max-w-3xl text-base leading-8 text-muted-foreground">
          TanStack Start gives you type-safe routing, server functions, and
          modern SSR defaults. Use this as a clean foundation, then layer in
          your own routes, styling, and add-ons.
        </p>
      </section>
    </main>
  )
}
