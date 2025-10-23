import { SteeringWheel } from "./pages/SteeringWheel";
import StartRun from "./pages/StartRun";
import RunTimeline from "./pages/RunTimeline";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  const hash = window.location.hash;
  const runMatch = hash.match(/^#\/run\/(.+)$/);
  
  let page;
  if (runMatch) {
    page = <RunTimeline runId={runMatch[1]} />;
  } else if (hash === "#/steering") {
    page = <SteeringWheel />;
  } else {
    page = <StartRun />;
  }

  return (
    <div className="dark">
      {page}
      <Toaster />
    </div>
  );
}
