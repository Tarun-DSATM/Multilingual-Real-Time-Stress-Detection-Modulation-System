import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Users, Activity, Languages, TrendingDown } from "lucide-react";

interface Stats {
  totalUsers: number;
  totalSessions: number;
  avgStress: number;
  languagesUsed: number;
}

export const UserSummary = () => {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalSessions: 0,
    avgStress: 0,
    languagesUsed: 0,
  });

  useEffect(() => {
    fetchStats();
    
    const channel = supabase
      .channel('stats-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        () => {
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    const { data: users } = await supabase.from('users').select('user_id');
    const { data: sessions } = await supabase.from('sessions').select('stress_score, language');

    const totalUsers = users?.length || 0;
    const totalSessions = sessions?.length || 0;
    
    let avgStress = 0;
    if (sessions && sessions.length > 0) {
      const sum = sessions.reduce((acc, s) => acc + s.stress_score, 0);
      avgStress = sum / sessions.length;
    }

    const languages = new Set(sessions?.map(s => s.language) || []);
    const languagesUsed = languages.size;

    setStats({ totalUsers, totalSessions, avgStress, languagesUsed });
  };

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Total Sessions",
      value: stats.totalSessions,
      icon: Activity,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
    {
      title: "Avg Stress Level",
      value: `${(stats.avgStress * 100).toFixed(1)}%`,
      icon: TrendingDown,
      color: stats.avgStress < 0.5 ? "text-success" : stats.avgStress < 0.65 ? "text-warning" : "text-destructive",
      bgColor: stats.avgStress < 0.5 ? "bg-success/10" : stats.avgStress < 0.65 ? "bg-warning/10" : "bg-destructive/10",
    },
    {
      title: "Languages Used",
      value: stats.languagesUsed,
      icon: Languages,
      color: "text-info",
      bgColor: "bg-info/10",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};