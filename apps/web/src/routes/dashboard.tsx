import { useProjectsApi } from "#/api/projects/list";
import { Button } from "#/components/ui/button";
import { Card } from "#/components/ui/card";
import { APP_ROUTES } from "#/lib/app-routes";
import { cn } from "#/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderKanban, LayoutDashboard, Plus } from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/dashboard")({ component: DashboardRoute });

function DashboardRoute() {
  const projectsQuery = useProjectsApi();
  const projects = projectsQuery.data?.projects ?? [];

  return (
    <main className="min-h-screen bg-background text-foreground md:flex">
      <aside className="border-b border-border bg-surface-paper/70 p-4 md:sticky md:top-0 md:h-screen md:w-60 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-4 md:block">
          <Link to={APP_ROUTES.DASHBOARD} className="flex items-center gap-3">
            <img src="/logo.png" alt="Kerning" className="size-9 border" />
            <span className="font-sans text-xs font-semibold uppercase tracking-[0.08em]">
              Kerning
            </span>
          </Link>


          <Button asChild className="md:mt-8 md:w-full">
            <Link to="/new">
              <Plus />
              New Project
            </Link>
          </Button>
        </div>

        <nav className="mt-4 flex gap-2 overflow-x-auto md:mt-6 md:block md:space-y-2">
          <SidebarLink to={APP_ROUTES.DASHBOARD} active>
            <LayoutDashboard />
            Dashboard

          </SidebarLink>
        </nav>
      </aside>

      <section className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-sans text-xs font-semibold uppercase text-muted-foreground">
                Dashboard
              </p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
                Projects
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Create font-pairing projects, save uploaded font files, and keep
                Google font selections as project metadata.
              </p>
            </div>

            <Button asChild variant="outline">
              <Link to="/new">
                <Plus />
                Create Project
              </Link>
            </Button>
          </div>

          <div className="mt-8">
            {projectsQuery.isLoading ? (
              <ProjectGridSkeleton />
            ) : projectsQuery.isError ? (
              <Card className="border p-5">
                <p className="text-sm text-destructive">
                  Unable to load projects right now.
                </p>
              </Card>
            ) : projects.length ? (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {projects.map((project) => (
                  <Link
                    key={project.id}
                    to="/project/$projectId"
                    params={{ projectId: project.id }}
                    className="group rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/25"
                  >
                    <Card className="h-full border p-5 transition-[border-color,background-color] group-hover:border-foreground/20 group-hover:bg-surface-wash">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-semibold">
                            {project.name}
                          </h2>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Updated {formatProjectDate(project.updatedAt)}
                          </p>
                        </div>
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                          <FolderKanban className="size-5" />
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                        <span>
                          {project.fonts?.length ?? 0}{" "}
                          {(project.fonts?.length ?? 0) === 1 ? "font" : "fonts"}
                        </span>
                        <span className="font-sans uppercase">
                          v{project.version}
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className="border p-6 sm:p-8">
                <div className="max-w-md">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-accent">
                    <FolderKanban className="size-6" />
                  </div>
                  <h2 className="mt-5 text-xl font-semibold">
                    Create your first project
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Upload font files or browse Google Fonts, then save the set
                    as a reusable Kerning project.
                  </p>
                  <Button asChild className="mt-6">
                    <Link to="/new">
                      <Plus />
                      New Project
                    </Link>
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function SidebarLink({
  to,
  active,
  children,
}: {
  to: string;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground md:flex",
        active && "bg-accent/50 text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

function ProjectGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="border p-5">
          <div className="h-5 w-2/3 rounded bg-muted" />
          <div className="mt-3 h-3 w-1/2 rounded bg-muted" />
          <div className="mt-8 h-10 rounded bg-muted" />
        </Card>
      ))}
    </div>
  );
}

function formatProjectDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
