import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Rocket } from "lucide-react";
import backend from "~backend/client";

export default function StartRun() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [appPackage, setAppPackage] = useState("");
  const [goal, setGoal] = useState("");

  const handleStart = async () => {
    if (!appPackage.trim()) {
      toast({
        variant: "destructive",
        title: "Missing app package",
        description: "Please enter an app package name",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await backend.run.start({
        appPackage: appPackage.trim(),
        goal: goal.trim() || undefined,
      });

      toast({
        title: "Run started",
        description: `Run ${response.runId} is now in progress`,
      });

      window.location.hash = `#/run/${response.runId}`;
    } catch (error) {
      console.error("Failed to start run:", error);
      toast({
        variant: "destructive",
        title: "Failed to start run",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="w-5 h-5" />
            Start New Run
          </CardTitle>
          <CardDescription>
            Configure and launch a new exploration run
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="appPackage">App Package</Label>
            <Input
              id="appPackage"
              placeholder="com.example.app"
              value={appPackage}
              onChange={(e: any) => setAppPackage(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Goal (optional)</Label>
            <Textarea
              id="goal"
              placeholder="What should the run accomplish?"
              value={goal}
              onChange={(e: any) => setGoal(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>

          <Button
            className="w-full"
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? "Starting..." : "Explore"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
