import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Clock } from "lucide-react";

interface TimeData {
  period: string;
  avgStress: number;
  sessions: number;
}

export const TimeOfDayChart = () => {
  const [data, setData] = useState<TimeData[]>([]);

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('timeofday-changes')
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
      console.error('Error fetching time of day data:', error);
      return;
    }

    const periods = {
      'Morning (6-12)': { total: 0, count: 0 },
      'Afternoon (12-18)': { total: 0, count: 0 },
      'Evening (18-24)': { total: 0, count: 0 },
      'Night (0-6)': { total: 0, count: 0 },
    };

    sessions?.forEach(session => {
      const hour = new Date(session.timestamp).getHours();
      let period: keyof typeof periods;
      
      if (hour >= 6 && hour < 12) period = 'Morning (6-12)';
      else if (hour >= 12 && hour < 18) period = 'Afternoon (12-18)';
      else if (hour >= 18 && hour < 24) period = 'Evening (18-24)';
      else period = 'Night (0-6)';

      periods[period].total += session.stress_score;
      periods[period].count++;
    });

    const chartData = Object.entries(periods).map(([period, stats]) => ({
      period,
      avgStress: stats.count > 0 ? (stats.total / stats.count) * 100 : 0,
      sessions: stats.count,
    }));

    setData(chartData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Time of Day Analysis
        </CardTitle>
        <CardDescription>Average stress levels by time period</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="period" 
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              label={{ value: 'Avg Stress %', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }}
              formatter={(value: number, name: string) => {
                if (name === 'avgStress') return [`${value.toFixed(1)}%`, 'Avg Stress'];
                return [value, 'Sessions'];
              }}
            />
            <Legend />
            <Bar dataKey="avgStress" fill="hsl(var(--primary))" name="Avg Stress %" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
