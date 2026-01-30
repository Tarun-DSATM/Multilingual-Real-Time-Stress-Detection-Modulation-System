import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";

interface StressGaugeProps {
  currentStress: number;
}

export const StressGauge = ({ currentStress }: StressGaugeProps) => {
  const getStressLevel = (stress: number) => {
    if (stress < 0.3) return { label: "Low", color: "text-success", bgColor: "bg-success" };
    if (stress < 0.6) return { label: "Moderate", color: "text-warning", bgColor: "bg-warning" };
    return { label: "High", color: "text-destructive", bgColor: "bg-destructive" };
  };

  const level = getStressLevel(currentStress);
  const percentage = currentStress * 100;
  const rotation = (percentage / 100) * 180 - 90;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Current Stress Level
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative w-64 h-32 mb-4">
            {/* Gauge background */}
            <svg className="w-full h-full" viewBox="0 0 200 100">
              {/* Low zone */}
              <path
                d="M 10 90 A 80 80 0 0 1 70 30"
                fill="none"
                stroke="hsl(var(--success))"
                strokeWidth="20"
                opacity="0.3"
              />
              {/* Moderate zone */}
              <path
                d="M 70 30 A 80 80 0 0 1 130 30"
                fill="none"
                stroke="hsl(var(--warning))"
                strokeWidth="20"
                opacity="0.3"
              />
              {/* High zone */}
              <path
                d="M 130 30 A 80 80 0 0 1 190 90"
                fill="none"
                stroke="hsl(var(--destructive))"
                strokeWidth="20"
                opacity="0.3"
              />
              {/* Needle */}
              <line
                x1="100"
                y1="90"
                x2="100"
                y2="20"
                stroke="hsl(var(--foreground))"
                strokeWidth="3"
                strokeLinecap="round"
                transform={`rotate(${rotation} 100 90)`}
                style={{ transition: "transform 0.5s ease-out" }}
              />
              <circle cx="100" cy="90" r="6" fill="hsl(var(--foreground))" />
            </svg>
          </div>
          
          <div className="text-center">
            <div className={`text-4xl font-bold ${level.color} mb-2`}>
              {percentage.toFixed(1)}%
            </div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${level.bgColor}/10`}>
              <div className={`w-3 h-3 rounded-full ${level.bgColor}`} />
              <span className={`text-sm font-medium ${level.color}`}>{level.label} Stress</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
