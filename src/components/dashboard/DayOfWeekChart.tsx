import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Calendar } from "lucide-react";

interface DayData {
  day: string;
  avgStress: number;
  sessions: number;
}

export const DayOfWeekChart = () => {
  const [data, setData] = useState<DayData[]>([]);

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('dayofweek-changes')
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
      console.error('Error fetching day of week data:', error);
      return;
    }

    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayStats: Record<string, { total: number; count: number }> = {};
    
    days.forEach(day => {
      dayStats[day] = { total: 0, count: 0 };
    });

    sessions?.forEach(session => {
      const dayIndex = new Date(session.timestamp).getDay();
      const dayName = days[dayIndex];
      dayStats[dayName].total += session.stress_score * 100;
      dayStats[dayName].count++;
    });

    const chartData = days.map(day => ({
      day,
      avgStress: dayStats[day].count > 0 ? dayStats[day].total / dayStats[day].count : 0,
      sessions: dayStats[day].count,
    }));

    setData(chartData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Day of Week Analysis
        </CardTitle>
        <CardDescription>Stress patterns across different days</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="day" 
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
