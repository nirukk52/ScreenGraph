import React, { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Loader2, WifiOff } from "lucide-react";
import EventBlock from "@/components/run/EventBlock";

interface RunEvent {
  id: number;
  type: string;
  data: any;
  timestamp: string;
}

interface RunTimelineProps {
  runId: string;
}

export default function RunTimeline({ runId }: RunTimelineProps) {
  const { toast } = useToast();
  
  const [events, setEvents] = useState<RunEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);
  
  const streamRef = useRef<AsyncIterable<any> | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isReconnectingRef = useRef(false);

  const connectToStream = async () => {
    if (!runId || isReconnectingRef.current) return;

    try {
      setIsLoading(true);
      setError(null);
      isReconnectingRef.current = true;

      const lastEventId = events.length > 0 ? events[events.length - 1].id : 0;

      const stream = await (window as any).encoreBackendClient.run.stream({
        id: runId,
        lastEventId,
      });

      streamRef.current = stream;
      setIsConnected(true);
      setIsLoading(false);
      isReconnectingRef.current = false;

      for await (const event of stream) {
        setEvents((prev: any) => {
          const exists = prev.some((e: any) => e.id === event.id);
          if (exists) return prev;
          return [...prev, event];
        });

        const terminalEvents = ["RUN_COMPLETED", "RUN_FAILED", "RUN_CANCELLED"];
        if (terminalEvents.includes(event.type)) {
          setIsComplete(true);
          setIsConnected(false);
          break;
        }
      }

      setIsConnected(false);
    } catch (err) {
      console.error("Stream error:", err);
      setIsConnected(false);
      setError(err instanceof Error ? err.message : "Connection failed");
      
      if (!isComplete) {
        reconnectTimeoutRef.current = setTimeout(() => {
          isReconnectingRef.current = false;
          connectToStream();
        }, 3000);
      }
    } finally {
      setIsLoading(false);
      isReconnectingRef.current = false;
    }
  };

  useEffect(() => {
    connectToStream();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      streamRef.current = null;
    };
  }, [runId]);

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => window.location.hash = "#/"}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Run Timeline</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Run ID: {runId}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Connecting...
                  </div>
                )}
                {!isLoading && isConnected && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm text-muted-foreground">Live</span>
                  </div>
                )}
                {!isLoading && !isConnected && !isComplete && (
                  <div className="flex items-center gap-2 text-sm text-orange-500">
                    <WifiOff className="w-4 h-4" />
                    Reconnecting...
                  </div>
                )}
                {isComplete && (
                  <span className="text-sm text-muted-foreground">Complete</span>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {error && !isComplete && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">
                {error}
              </div>
            )}

            {events.length === 0 && isLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Waiting for events...</p>
              </div>
            )}

            {events.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p>No events yet</p>
              </div>
            )}

            {events.length > 0 && (
              <div className="space-y-0">
                {events.map((event: any) => (
                  <EventBlock
                    key={event.id}
                    id={event.id}
                    type={event.type}
                    data={event.data}
                    timestamp={event.timestamp}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
