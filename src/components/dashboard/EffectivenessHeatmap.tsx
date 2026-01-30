import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Target } from "lucide-react";

export const EffectivenessHeatmap = () => {
  const [data, setData] = useState<Record<string, { avg: number; count: number }>>({});

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('effectiveness-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('intervention, effectiveness')
      .not('effectiveness', 'is', null);

    if (error) {
      console.error('Error fetching effectiveness:', error);
      return;
    }

    // Calculate average effectiveness by intervention type
    const effectiveness: Record<string, { total: number; count: number }> = {};
    
    sessions?.forEach(session => {
      const intervention = session.intervention || 'unknown';
      if (!effectiveness[intervention]) {
        effectiveness[intervention] = { total: 0, count: 0 };
      }
      effectiveness[intervention].total += session.effectiveness || 0;
      effectiveness[intervention].count++;
    });

    const heatmapData: Record<string, { avg: number; count: number }> = {};
    Object.entries(effectiveness).forEach(([intervention, data]) => {
      heatmapData[intervention] = {
        avg: data.count > 0 ? data.total / data.count : 0,
        count: data.count,
      };
    });

    setData(heatmapData);
  };

  const getColorClass = (value: number) => {
    if (value >= 0.7) return "bg-chart-low";
    if (value >= 0.4) return "bg-chart-moderate";
    return "bg-chart-high";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Intervention Effectiveness
        </CardTitle>
        <CardDescription>Average stress reduction by type</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(data).map(([intervention, stats]) => (
            <div key={intervention} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium capitalize">{intervention}</span>
                <span className="text-sm text-muted-foreground">
                  {(stats.avg * 100).toFixed(1)}% ({stats.count} sessions)
                </span>
              </div>
              <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${getColorClass(stats.avg)} transition-all duration-500`}
                  style={{ width: `${stats.avg * 100}%` }}
                />
              </div>
            </div>
          ))}
          {Object.keys(data).length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No effectiveness data available yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};