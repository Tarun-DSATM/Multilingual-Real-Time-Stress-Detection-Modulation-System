import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Target, TrendingUp, Zap } from "lucide-react";

interface Stats {
  totalSessions: number;
  avgStress: number;
  totalInterventions: number;
  successRate: number;
}

export const SessionStats = () => {
  const [stats, setStats] = useState<Stats>({
    totalSessions: 0,
    avgStress: 0,
    totalInterventions: 0,
    successRate: 0,
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
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('stress_score, effectiveness');

    if (error) {
      console.error('Error fetching stats:', error);
      return;
    }

    const total = sessions?.length || 0;
    const avgStress = sessions?.reduce((sum, s) => sum + s.stress_score, 0) / total || 0;
    
    const successfulInterventions = sessions?.filter(s => s.effectiveness && s.effectiveness > 0.3).length || 0;
    const totalInterventions = sessions?.filter(s => s.effectiveness !== null).length || 0;
    const successRate = totalInterventions > 0 ? (successfulInterventions / totalInterventions) * 100 : 0;

    setStats({
      totalSessions: total,
      avgStress: avgStress * 100,
      totalInterventions,
      successRate,
    });
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSessions}</div>
          <p className="text-xs text-muted-foreground">All time sessions recorded</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Stress</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgStress.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">Across all sessions</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Interventions</CardTitle>
          <Zap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalInterventions}</div>
          <p className="text-xs text-muted-foreground">Total interventions applied</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">Effective interventions</p>
        </CardContent>
      </Card>
    </div>
  );
};
