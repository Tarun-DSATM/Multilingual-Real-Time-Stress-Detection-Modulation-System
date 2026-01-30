import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingDown } from "lucide-react";

interface ComparisonData {
  intervention: string;
  before: number;
  after: number;
  reduction: number;
}

export const BeforeAfterChart = () => {
  const [data, setData] = useState<ComparisonData[]>([]);

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('comparison-changes')
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
      .select('intervention, stress_score, effectiveness')
      .not('effectiveness', 'is', null)
      .not('intervention', 'is', null);

    if (error) {
      console.error('Error fetching comparison data:', error);
      return;
    }

    // Group by intervention type
    const interventions: Record<string, { beforeTotal: number; afterTotal: number; count: number }> = {};
    
    sessions?.forEach(session => {
      const intervention = session.intervention || 'unknown';
      if (!interventions[intervention]) {
        interventions[intervention] = { beforeTotal: 0, afterTotal: 0, count: 0 };
      }
      
      const before = session.stress_score * 100;
      const after = before * (1 - (session.effectiveness || 0));
      
      interventions[intervention].beforeTotal += before;
      interventions[intervention].afterTotal += after;
      interventions[intervention].count++;
    });

    const chartData = Object.entries(interventions).map(([intervention, stats]) => ({
      intervention: intervention.charAt(0).toUpperCase() + intervention.slice(1),
      before: stats.count > 0 ? stats.beforeTotal / stats.count : 0,
      after: stats.count > 0 ? stats.afterTotal / stats.count : 0,
      reduction: stats.count > 0 ? ((stats.beforeTotal - stats.afterTotal) / stats.beforeTotal) * 100 : 0,
    }));

    setData(chartData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Before/After Comparison
        </CardTitle>
        <CardDescription>Stress levels before and after interventions</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="intervention" 
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              label={{ value: 'Stress %', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }}
              formatter={(value: number) => `${value.toFixed(1)}%`}
            />
            <Legend />
            <Bar dataKey="before" fill="hsl(var(--destructive))" name="Before" radius={[8, 8, 0, 0]} />
            <Bar dataKey="after" fill="hsl(var(--success))" name="After" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
