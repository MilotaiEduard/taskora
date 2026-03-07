import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div>
      <h1>Hello app</h1>

      <Outlet />
    </div>
  );
}
