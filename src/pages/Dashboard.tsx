import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Activity, Download } from "lucide-react";
import { StressChart } from "@/components/dashboard/StressChart";
import { InterventionTimeline } from "@/components/dashboard/InterventionTimeline";
import { LanguagePieChart } from "@/components/dashboard/LanguagePieChart";
import { EffectivenessHeatmap } from "@/components/dashboard/EffectivenessHeatmap";
import { SessionsTable } from "@/components/dashboard/SessionsTable";
import { UserSummary } from "@/components/dashboard/UserSummary";
import { StressGauge } from "@/components/dashboard/StressGauge";
import { StressHeatmap } from "@/components/dashboard/StressHeatmap";
import { TimeOfDayChart } from "@/components/dashboard/TimeOfDayChart";
import { BeforeAfterChart } from "@/components/dashboard/BeforeAfterChart";
import { DayOfWeekChart } from "@/components/dashboard/DayOfWeekChart";
import { InterventionSuccessRate } from "@/components/dashboard/InterventionSuccessRate";
import { StressDistribution } from "@/components/dashboard/StressDistribution";
import { SessionStats } from "@/components/dashboard/SessionStats";
import { VoiceStressDetector } from "@/components/dashboard/VoiceStressDetector";
import { exportDataAsCSV, exportDataAsJSON } from "@/utils/exportChart";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [latestStress, setLatestStress] = useState(0.5);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/");
        return;
      }
      
      setUser(session.user);
      setIsLoading(false);
    };

    checkAuth();

    // Fetch latest stress score
    const fetchLatestStress = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('stress_score')
        .order('timestamp', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        setLatestStress(data[0].stress_score);
      }
    };

    fetchLatestStress();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        navigate("/");
      } else if (session) {
        setUser(session.user);
      }
    });

    // Subscribe to real-time stress updates
    const stressChannel = supabase
      .channel('latest-stress')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'sessions'
        },
        (payload: any) => {
          setLatestStress(payload.new.stress_score);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(stressChannel);
    };
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Signed Out",
        description: "Successfully signed out",
      });
      navigate("/");
    }
  };

  const handleExportCSV = async () => {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (sessions) {
      exportDataAsCSV(sessions, 'stress-sessions');
      toast({
        title: "Export Successful",
        description: "Data exported as CSV",
      });
    }
  };

  const handleExportJSON = async () => {
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (sessions) {
      exportDataAsJSON(sessions, 'stress-sessions');
      toast({
        title: "Export Successful",
        description: "Data exported as JSON",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Activity className="h-12 w-12 animate-pulse text-primary mx-auto" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Voice-Aware Zen</h1>
              <p className="text-xs text-muted-foreground">Clinical Dashboard</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block mr-2">
              <p className="text-sm font-medium">{user?.email}</p>
              <p className="text-xs text-muted-foreground">Clinician</p>
            </div>
            <Button onClick={handleExportCSV} variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button onClick={handleExportJSON} variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-6 space-y-6">
        {/* User Summary */}
        <UserSummary />

        {/* Session Statistics */}
        <SessionStats />

        {/* Real-Time Monitoring */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <StressChart />
          </div>
          <div className="space-y-6">
            <StressGauge currentStress={latestStress} />
            <VoiceStressDetector onStressDetected={setLatestStress} />
          </div>
        </div>

        {/* Stress Patterns */}
        <StressHeatmap />

        {/* Time Analysis */}
        <div className="grid gap-6 md:grid-cols-2">
          <TimeOfDayChart />
          <DayOfWeekChart />
        </div>

        {/* Stress Distribution */}
        <StressDistribution />

        {/* Intervention Analytics */}
        <div className="grid gap-6 md:grid-cols-2">
          <InterventionSuccessRate />
          <InterventionTimeline />
        </div>

        {/* Intervention Effectiveness */}
        <div className="grid gap-6 md:grid-cols-2">
          <BeforeAfterChart />
          <EffectivenessHeatmap />
        </div>

        {/* Language Analytics */}
        <LanguagePieChart />

        {/* Sessions Table */}
        <SessionsTable />
      </main>
    </div>
  );
};

export default Dashboard;