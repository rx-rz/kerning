import { Outlet, createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHead } from "#/components/ui/card";

export const Route = createFileRoute("/auth")({
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <main className="flex min-h-screen items-center justify-center border bg-background p-4 lg:p-0">
      <div className="w-full max-w-md lg:w-2/5 lg:max-w-none">
        <div className="mx-auto w-full max-w-sm lg:max-w-10/12">
          <img src="/logo.png" className="size-12 border-border border mb-2" />
          <Outlet />
        </div>
      </div>
      <div className="hidden h-screen flex-1 lg:block lg:w-3/5">
        <Card
          variant="checkered"
          className="w-full flex items-center justify-center h-full rounded-none"
        >
          <Card
            variant="frosted"
            className="h-[min(70vh,600px)] w-[min(34vw,400px)] bg-transparent backdrop-blur-lg border-accent border"
          >
            <CardHead
              variant="solid"
              className="bg-accent"
              title={"Font Example"}
            />
            <CardContent>
              <div className="relative inline-block">
                <img src="/splash.webp" className="border" alt="" />
                <div className="absolute inset-0 bg-accent opacity-40 mix-blend-multiply pointer-events-none" />
              </div>
            </CardContent>
          </Card>
        </Card>
      </div>
    </main>
  );
}
