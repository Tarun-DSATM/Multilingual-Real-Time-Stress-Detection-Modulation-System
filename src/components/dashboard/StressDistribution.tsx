import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { BarChart3 } from "lucide-react";

interface DistributionData {
  range: string;
  count: number;
}

export const StressDistribution = () => {
  const [data, setData] = useState<DistributionData[]>([]);

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('distribution-changes')
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
      .select('stress_score');

    if (error) {
      console.error('Error fetching distribution data:', error);
      return;
    }

    const ranges = {
      '0-20%': 0,
      '20-40%': 0,
      '40-60%': 0,
      '60-80%': 0,
      '80-100%': 0,
    };

    sessions?.forEach(session => {
      const stress = session.stress_score * 100;
      if (stress < 20) ranges['0-20%']++;
      else if (stress < 40) ranges['20-40%']++;
      else if (stress < 60) ranges['40-60%']++;
      else if (stress < 80) ranges['60-80%']++;
      else ranges['80-100%']++;
    });

    const chartData = Object.entries(ranges).map(([range, count]) => ({
      range,
      count,
    }));

    setData(chartData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Stress Distribution
        </CardTitle>
        <CardDescription>Frequency of stress levels across all sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="range" 
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              label={{ value: 'Sessions', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
