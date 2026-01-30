import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AlertCircle } from "lucide-react";

export const InterventionTimeline = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('intervention-changes')
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
      .select('intervention, timestamp')
      .not('intervention', 'is', null)
      .order('timestamp', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error fetching interventions:', error);
      return;
    }

    // Group by intervention type
    const interventionCounts: Record<string, { mild: number; moderate: number; high: number }> = {};
    
    sessions?.forEach(session => {
      const date = new Date(session.timestamp).toLocaleDateString();
      if (!interventionCounts[date]) {
        interventionCounts[date] = { mild: 0, moderate: 0, high: 0 };
      }
      
      const intervention = session.intervention?.toLowerCase() || 'mild';
      if (intervention.includes('mild')) {
        interventionCounts[date].mild++;
      } else if (intervention.includes('moderate')) {
        interventionCounts[date].moderate++;
      } else if (intervention.includes('high')) {
        interventionCounts[date].high++;
      }
    });

    const chartData = Object.entries(interventionCounts).map(([date, counts]) => ({
      date,
      ...counts,
    }));

    setData(chartData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-primary" />
          Intervention Timeline
        </CardTitle>
        <CardDescription>Distribution by severity level</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
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
            <Legend />
            <Bar dataKey="mild" fill="hsl(var(--chart-low))" name="Mild" />
            <Bar dataKey="moderate" fill="hsl(var(--chart-moderate))" name="Moderate" />
            <Bar dataKey="high" fill="hsl(var(--chart-high))" name="High" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};