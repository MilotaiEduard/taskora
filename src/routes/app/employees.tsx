import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/employees')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/employees"!</div>
}
