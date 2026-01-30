import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Target } from "lucide-react";

interface SuccessData {
  name: string;
  value: number;
  color: string;
}

export const InterventionSuccessRate = () => {
  const [data, setData] = useState<SuccessData[]>([]);

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('success-rate-changes')
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
      .select('effectiveness')
      .not('effectiveness', 'is', null);

    if (error) {
      console.error('Error fetching success rate data:', error);
      return;
    }

    let effective = 0;
    let moderate = 0;
    let ineffective = 0;

    sessions?.forEach(session => {
      const reduction = (session.effectiveness || 0) * 100;
      if (reduction > 30) effective++;
      else if (reduction >= 10) moderate++;
      else ineffective++;
    });

    const total = sessions?.length || 0;
    
    setData([
      { 
        name: 'Effective (>30%)', 
        value: total > 0 ? Math.round((effective / total) * 100) : 0,
        color: 'hsl(var(--success))'
      },
      { 
        name: 'Moderate (10-30%)', 
        value: total > 0 ? Math.round((moderate / total) * 100) : 0,
        color: 'hsl(var(--warning))'
      },
      { 
        name: 'Ineffective (<10%)', 
        value: total > 0 ? Math.round((ineffective / total) * 100) : 0,
        color: 'hsl(var(--destructive))'
      },
    ]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Intervention Success Rate
        </CardTitle>
        <CardDescription>Effectiveness breakdown by stress reduction</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }}
              formatter={(value: number) => `${value}%`}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
