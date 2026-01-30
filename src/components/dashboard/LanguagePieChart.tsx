import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Globe } from "lucide-react";

const LANGUAGE_NAMES: Record<string, string> = {
  kn: "Kannada",
  te: "Telugu",
  hi: "Hindi",
  ta: "Tamil",
  ur: "Urdu",
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(var(--chart-moderate))",
  "hsl(var(--chart-low))",
  "hsl(var(--destructive))",
];

export const LanguagePieChart = () => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('language-changes')
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
      .select('language');

    if (error) {
      console.error('Error fetching languages:', error);
      return;
    }

    // Count language usage
    const languageCounts: Record<string, number> = {};
    sessions?.forEach(session => {
      const lang = session.language || 'unknown';
      languageCounts[lang] = (languageCounts[lang] || 0) + 1;
    });

    const chartData = Object.entries(languageCounts).map(([lang, count]) => ({
      name: LANGUAGE_NAMES[lang] || lang.toUpperCase(),
      value: count,
    }));

    setData(chartData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Language Distribution
        </CardTitle>
        <CardDescription>Usage across supported languages</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px"
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};