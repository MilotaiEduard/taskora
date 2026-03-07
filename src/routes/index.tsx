import { createFileRoute } from "@tanstack/react-router";
import Navbar from "../components/Navbar";

export const Route = createFileRoute("/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="landing-page-container">
      <Navbar />
    </div>
  );
}
