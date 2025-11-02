import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";

const AdminReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [idImageUrl, setIdImageUrl] = useState<string | null>(null);
  const [selfieImageUrl, setSelfieImageUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchSubmission();
  }, [id]);

  useEffect(() => {
    const loadImages = async () => {
      if (submission) {
        const idUrl = await getImageUrl(submission.id_image_url);
        const selfieUrl = await getImageUrl(submission.selfie_image_url);
        setIdImageUrl(idUrl);
        setSelfieImageUrl(selfieUrl);
      }
    };
    loadImages();
  }, [submission]);

  const fetchSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("id", parseInt(id || "0"))
        .single();

      if (error) throw error;
      setSubmission(data);
    } catch (error: any) {
      toast.error("Failed to load submission");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: "approved" | "rejected") => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from("submissions")
        .update({ status: newStatus })
        .eq("id", parseInt(id || "0"));

      if (error) throw error;

      toast.success(`Submission ${newStatus}!`);
      navigate("/admin");
    } catch (error: any) {
      toast.error("Failed to update submission");
      console.error(error);
    } finally {
      setUpdating(false);
    }
  };

  const getImageUrl = async (path: string | null) => {
    if (!path) return null;
    const { data, error } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrl(path, 300); // 5 minute expiry
    if (error) {
      console.error("Failed to create signed URL:", error);
      return null;
    }
    return data?.signedUrl || null;
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!submission) {
    return (
      <ProtectedRoute requireAdmin>
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-xl text-muted-foreground">Submission not found</p>
        </div>
      </ProtectedRoute>
    );
  }

  const aiScores = submission.ai_scores || {};
  const extractedData = submission.extracted_data || {};
  const similarityScore = aiScores.similarity_score || 0;
  const fraudScore = aiScores.fraud_score || 0;

  const getFraudBadge = () => {
    if (fraudScore < 30) {
      return <Badge className="bg-success text-lg py-1">Low Risk</Badge>;
    } else if (fraudScore < 70) {
      return <Badge className="bg-warning text-lg py-1">Medium Risk</Badge>;
    } else {
      return <Badge variant="destructive" className="text-lg py-1">High Risk</Badge>;
    }
  };

  const getMatchBadge = () => {
    if (similarityScore >= 80) {
      return <Badge className="bg-success text-lg py-1">High Match</Badge>;
    } else if (similarityScore >= 60) {
      return <Badge className="bg-warning text-lg py-1">Medium Match</Badge>;
    } else {
      return <Badge variant="destructive" className="text-lg py-1">Low Match</Badge>;
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-background">
        <header className="border-b bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => navigate("/admin")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="flex gap-4 mb-6">
            <Button
              size="lg"
              onClick={() => updateStatus("approved")}
              disabled={updating || submission.status === "approved"}
              className="bg-success hover:bg-success/90"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Approve
            </Button>
            <Button
              size="lg"
              variant="destructive"
              onClick={() => updateStatus("rejected")}
              disabled={updating || submission.status === "rejected"}
            >
              <XCircle className="w-5 h-5 mr-2" />
              Reject
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column: Documents */}
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Submitted Documents</CardTitle>
                  <CardDescription>ID Card and Selfie</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">ID Document</h3>
                    {submission.id_image_url ? (
                      <img
                        src={idImageUrl || ""}
                        alt="ID Document"
                        className="w-full rounded-lg border"
                      />
                    ) : (
                      <p className="text-muted-foreground">No ID image</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Selfie</h3>
                    {submission.selfie_image_url ? (
                      <img
                        src={selfieImageUrl || ""}
                        alt="Selfie"
                        className="w-full rounded-lg border"
                      />
                    ) : (
                      <p className="text-muted-foreground">No selfie image</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column: AI Analysis */}
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>AI Verification Analysis</CardTitle>
                  <CardDescription>Automated security checks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Face Match Score */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Face Similarity Score</span>
                      {getMatchBadge()}
                    </div>
                    <Progress value={similarityScore} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-1">{similarityScore}% match</p>
                    {aiScores.match_confidence && (
                      <p className="text-sm mt-1">Confidence: {aiScores.match_confidence}</p>
                    )}
                  </div>

                  {/* Fraud Detection */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-semibold">Fraud Risk Score</span>
                      {getFraudBadge()}
                    </div>
                    <Progress value={fraudScore} className="h-3" />
                    <p className="text-sm text-muted-foreground mt-1">{fraudScore}% risk detected</p>
                    {aiScores.ai_recommendation && (
                      <p className="text-sm mt-1 font-medium">
                        AI Recommendation: <span className="capitalize">{aiScores.ai_recommendation}</span>
                      </p>
                    )}
                  </div>

                  {/* Extracted Data */}
                  <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3">Extracted Data (OCR)</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{extractedData.name || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date of Birth:</span>
                        <span className="font-medium">{extractedData.dob || "N/A"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ID Number:</span>
                        <span className="font-medium">{extractedData.id_number || "N/A"}</span>
                      </div>
                      {extractedData.document_type && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Document Type:</span>
                          <span className="font-medium capitalize">{extractedData.document_type}</span>
                        </div>
                      )}
                      {extractedData.country && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Country:</span>
                          <span className="font-medium">{extractedData.country}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Analysis Details */}
                  {aiScores.fraud_indicators && aiScores.fraud_indicators.length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Fraud Indicators</h3>
                      <ul className="text-sm space-y-1">
                        {aiScores.fraud_indicators.map((indicator: string, idx: number) => (
                          <li key={idx} className="text-destructive">• {indicator}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default AdminReview;
