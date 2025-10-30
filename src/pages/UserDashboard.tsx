import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, LogOut } from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";

const UserDashboard = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("user_id", user.id)
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

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-hero">
        <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-white">KYC-Karo</h1>
            <Button variant="outline" onClick={handleLogout} className="text-white border-white hover:bg-white/20">
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <Card className="shadow-card mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Upload KYC Documents</CardTitle>
              <CardDescription>Start your verification process</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-8">
              <Button
                size="lg"
                onClick={() => navigate("/new-submission")}
                className="bg-gradient-button shadow-button"
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload Documents
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>My KYC Status</CardTitle>
              <CardDescription>Track your verification submissions</CardDescription>
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
                      <TableHead>Submission ID</TableHead>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell className="font-medium">#{submission.id}</TableCell>
                        <TableCell>{new Date(submission.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>{getStatusBadge(submission.status)}</TableCell>
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

export default UserDashboard;
