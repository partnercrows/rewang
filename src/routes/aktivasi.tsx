import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/aktivasi')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/aktivasi"!</div>
}
