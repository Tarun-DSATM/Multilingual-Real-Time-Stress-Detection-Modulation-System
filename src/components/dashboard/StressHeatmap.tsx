import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "lucide-react";
import CalendarHeatmap from "react-calendar-heatmap";
import "react-calendar-heatmap/dist/styles.css";

interface HeatmapValue {
  date: string;
  count: number;
}

export const StressHeatmap = () => {
  const [data, setData] = useState<HeatmapValue[]>([]);

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('heatmap-changes')
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
      .select('timestamp, stress_score');

    if (error) {
      console.error('Error fetching heatmap data:', error);
      return;
    }

    // Group by date and calculate average stress
    const stressByDate: Record<string, { total: number; count: number }> = {};
    
    sessions?.forEach(session => {
      const date = new Date(session.timestamp).toISOString().split('T')[0];
      if (!stressByDate[date]) {
        stressByDate[date] = { total: 0, count: 0 };
      }
      stressByDate[date].total += session.stress_score * 100;
      stressByDate[date].count++;
    });

    const heatmapData = Object.entries(stressByDate).map(([date, stats]) => ({
      date,
      count: Math.round(stats.total / stats.count),
    }));

    setData(heatmapData);
  };

  const getClassForValue = (value: HeatmapValue | undefined) => {
    if (!value || value.count === 0) {
      return 'color-empty';
    }
    if (value.count < 30) return 'color-scale-1';
    if (value.count < 50) return 'color-scale-2';
    if (value.count < 70) return 'color-scale-3';
    return 'color-scale-4';
  };

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Stress Calendar Heatmap
        </CardTitle>
        <CardDescription>6-month stress level overview</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <CalendarHeatmap
            startDate={startDate}
            endDate={new Date()}
            values={data}
            classForValue={getClassForValue}
            tooltipDataAttrs={(value: HeatmapValue | undefined) => {
              if (!value || !value.date) {
                return { 'data-tooltip': 'No data' };
              }
              return {
                'data-tooltip': `${value.date}: ${value.count}% stress`,
              };
            }}
            showWeekdayLabels
          />
        </div>
        <style>{`
          .react-calendar-heatmap {
            width: 100%;
          }
          .react-calendar-heatmap .color-empty {
            fill: hsl(var(--muted));
          }
          .react-calendar-heatmap .color-scale-1 {
            fill: hsl(var(--success));
          }
          .react-calendar-heatmap .color-scale-2 {
            fill: hsl(var(--chart-moderate));
          }
          .react-calendar-heatmap .color-scale-3 {
            fill: hsl(var(--warning));
          }
          .react-calendar-heatmap .color-scale-4 {
            fill: hsl(var(--destructive));
          }
          .react-calendar-heatmap text {
            fill: hsl(var(--muted-foreground));
            font-size: 10px;
          }
        `}</style>
      </CardContent>
    </Card>
  );
};
