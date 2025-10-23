import { CheckCircle2, XCircle, AlertCircle, Circle, Play, Square } from "lucide-react";

interface EventBlockProps {
  id: number;
  type: string;
  data: any;
  timestamp: string;
}

const eventConfig: Record<string, { icon: any; color: string; label: string }> = {
  RUN_STARTED: { icon: Play, color: "text-blue-500", label: "Run Started" },
  RUN_COMPLETED: { icon: CheckCircle2, color: "text-green-500", label: "Run Completed" },
  RUN_FAILED: { icon: XCircle, color: "text-red-500", label: "Run Failed" },
  RUN_CANCELLED: { icon: Square, color: "text-orange-500", label: "Run Cancelled" },
  STEP_STARTED: { icon: Circle, color: "text-blue-400", label: "Step Started" },
  STEP_COMPLETED: { icon: CheckCircle2, color: "text-green-400", label: "Step Completed" },
  STEP_FAILED: { icon: AlertCircle, color: "text-red-400", label: "Step Failed" },
};

export default function EventBlock({ id, type, data, timestamp }: EventBlockProps) {
  const config = eventConfig[type] || { icon: Circle, color: "text-gray-500", label: type };
  const Icon = config.icon;

  return (
    <div className="flex gap-3 group">
      <div className="flex flex-col items-center">
        <div className={`mt-1 ${config.color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 w-px bg-border mt-2" />
      </div>
      
      <div className="flex-1 pb-6">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-medium text-foreground">{config.label}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        </div>
        
        {data && Object.keys(data).length > 0 && (
          <div className="mt-2 p-3 bg-muted rounded-md text-sm">
            <pre className="text-muted-foreground overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
