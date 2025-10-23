import React, { useState, useEffect } from "react";
import { SteeringWheel } from "./pages/SteeringWheel";
import StartRun from "./pages/StartRun";
import RunTimeline from "./pages/RunTimeline";
import { Toaster } from "@/components/ui/toaster";

export default function App() {
  const [hash, setHash] = useState(window.location.hash);
  
  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
    };
    
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  
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
