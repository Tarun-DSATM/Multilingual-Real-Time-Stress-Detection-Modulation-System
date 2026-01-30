import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { Download, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Session {
  session_id: string;
  user_id: string;
  timestamp: string;
  stress_score: number;
  language: string;
  intervention: string | null;
  effectiveness: number | null;
}

export const SessionsTable = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchSessions();
    
    const channel = supabase
      .channel('table-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions'
        },
        () => {
          fetchSessions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSessions = async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching sessions:', error);
      return;
    }

    setSessions(data || []);
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         session.session_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = languageFilter === "all" || session.language === languageFilter;
    return matchesSearch && matchesLanguage;
  });

  const exportToCSV = () => {
    const headers = ['Session ID', 'User ID', 'Timestamp', 'Stress Score', 'Language', 'Intervention', 'Effectiveness'];
    const rows = filteredSessions.map(s => [
      s.session_id,
      s.user_id,
      s.timestamp,
      s.stress_score.toFixed(2),
      s.language,
      s.intervention || 'N/A',
      s.effectiveness ? s.effectiveness.toFixed(2) : 'N/A'
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessions-${new Date().toISOString()}.csv`;
    a.click();

    toast({
      title: "Export Successful",
      description: "Sessions data exported to CSV",
    });
  };

  const exportToJSON = () => {
    const json = JSON.stringify(filteredSessions, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sessions-${new Date().toISOString()}.json`;
    a.click();

    toast({
      title: "Export Successful",
      description: "Sessions data exported to JSON",
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <CardTitle>Session Data</CardTitle>
            <CardDescription>Recent sessions with filtering and export</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button onClick={exportToJSON} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by user ID or session ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="border rounded-md px-3 py-2"
          >
            <option value="all">All Languages</option>
            <option value="kn">Kannada</option>
            <option value="te">Telugu</option>
            <option value="hi">Hindi</option>
            <option value="ta">Tamil</option>
            <option value="ur">Urdu</option>
          </select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>Stress</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Intervention</TableHead>
                <TableHead>Effectiveness</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <TableRow key={session.session_id}>
                  <TableCell className="font-mono text-sm">{session.user_id}</TableCell>
                  <TableCell className="text-sm">
                    {new Date(session.timestamp).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      session.stress_score < 0.5 ? 'bg-chart-low/10 text-success' :
                      session.stress_score < 0.65 ? 'bg-chart-moderate/10 text-warning' :
                      'bg-chart-high/10 text-destructive'
                    }`}>
                      {(session.stress_score * 100).toFixed(0)}%
                    </span>
                  </TableCell>
                  <TableCell className="uppercase text-sm">{session.language}</TableCell>
                  <TableCell className="capitalize text-sm">{session.intervention || '-'}</TableCell>
                  <TableCell>
                    {session.effectiveness 
                      ? `${(session.effectiveness * 100).toFixed(0)}%` 
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredSessions.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No sessions found matching your criteria
          </p>
        )}
      </CardContent>
    </Card>
  );
};