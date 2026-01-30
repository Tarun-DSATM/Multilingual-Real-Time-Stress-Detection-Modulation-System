import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

interface Session {
  session_id: string;
  user_id: string;
  timestamp: string;
  stress_score: number;
}

export const StressChart = () => {
  const [data, setData] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [users, setUsers] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('sessions-changes')
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
  }, [selectedUser]);

  const fetchData = async () => {
    let query = supabase
      .from('sessions')
      .select('session_id, user_id, timestamp, stress_score')
      .order('timestamp', { ascending: true });

    if (selectedUser !== "all") {
      query = query.eq('user_id', selectedUser);
    }

    const { data: sessions, error } = await query.limit(10);

    if (error) {
      console.error('Error fetching sessions:', error);
      return;
    }

    // Get unique users
    const { data: allSessions } = await supabase
      .from('sessions')
      .select('user_id');
    
    if (allSessions) {
      const uniqueUsers = [...new Set(allSessions.map(s => s.user_id))];
      setUsers(uniqueUsers);
    }

    // Transform data for chart
    const chartData = sessions?.map((session: Session) => ({
      timestamp: new Date(session.timestamp).toLocaleString(),
      stress: (session.stress_score * 100).toFixed(1),
      user: session.user_id,
    })) || [];

    setData(chartData);
  };

  const getStressColor = (value: number) => {
    if (value < 50) return "hsl(var(--chart-low))";
    if (value < 65) return "hsl(var(--chart-moderate))";
    return "hsl(var(--chart-high))";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Stress Score Timeline
            </CardTitle>
            <CardDescription>Last 10 sessions (0-100 scale)</CardDescription>
          </div>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="text-sm border rounded-md px-3 py-1.5"
          >
            <option value="all">All Users</option>
            {users.map(user => (
              <option key={user} value={user}>{user}</option>
            ))}
          </select>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="timestamp" 
              tick={{ fontSize: 12 }}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              domain={[0, 100]}
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
            <Line 
              type="monotone" 
              dataKey="stress" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              name="Stress Level (%)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};