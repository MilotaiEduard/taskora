import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/app/newsletters')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/app/newsletters"!</div>
}
