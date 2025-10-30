import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      toast.error("Failed to load submissions");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-success">{status}</Badge>;
      case "rejected":
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge className="bg-warning">{status}</Badge>;
    }
  };

  const getFraudBadge = (aiScores: any) => {
    const fraudScore = aiScores?.fraud_score || 0;
    if (fraudScore < 30) {
      return <Badge className="bg-success">Low Risk</Badge>;
    } else if (fraudScore < 70) {
      return <Badge className="bg-warning">Medium Risk</Badge>;
    } else {
      return <Badge variant="destructive">High Risk</Badge>;
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-primary">KYC-Karo Admin</h1>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>All Submissions</CardTitle>
              <CardDescription>Review and manage KYC verification requests</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : submissions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No submissions yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>Face Match</TableHead>
                      <TableHead>Fraud Risk</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">#{submission.id}</TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
                        <TableCell className="text-sm">{submission.user_id.substring(0, 8)}...</TableCell>
                        <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {submission.ai_scores?.similarity_score ? (
                            <span className="font-medium">{submission.ai_scores.similarity_score}%</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getFraudBadge(submission.ai_scores)}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/review/${submission.id}`)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AdminDashboard;
