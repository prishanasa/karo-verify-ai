import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const NewSubmission = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setIdFile(file);
    }
  };

  const handleSelfieUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelfieFile(file);
    }
  };

  const uploadFiles = async () => {
    if (!idFile || !selfieFile) {
      toast.error("Please upload both documents");
      return;
    }

    setUploading(true);
    setAnalyzing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const timestamp = Date.now();
      const idPath = `${user.id}/id_${timestamp}.${idFile.name.split(".").pop()}`;
      const selfiePath = `${user.id}/selfie_${timestamp}.${selfieFile.name.split(".").pop()}`;

      // Upload ID document
      const { error: idError } = await supabase.storage
        .from("kyc-documents")
        .upload(idPath, idFile);

      if (idError) throw idError;

      // Upload selfie
      const { error: selfieError } = await supabase.storage
        .from("kyc-documents")
        .upload(selfiePath, selfieFile);

      if (selfieError) throw selfieError;

      // Create submission record
      const { data: submission, error: submissionError } = await supabase
        .from("submissions")
        .insert({
          user_id: user.id,
          id_image_url: idPath,
          selfie_image_url: selfiePath,
          status: "pending",
        })
        .select()
        .single();

      if (submissionError) throw submissionError;

      // Call AI analysis edge function
      try {
        const { data: aiResult, error: aiError } = await supabase.functions.invoke("analyze-kyc", {
          body: {
            submission_id: submission.id,
            id_image_path: idPath,
            selfie_image_path: selfiePath,
          },
        });

        if (aiError) throw aiError;
        
        console.log("AI Analysis completed:", aiResult);
        setVerificationResult(aiResult);
        setStep(4); // Move to results step
      } catch (aiError) {
        console.error("AI analysis failed:", aiError);
        toast.error("AI verification failed. Please try again.");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to submit documents");
      console.error(error);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const progress = (step / 4) * 100;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-hero">
        <header className="bg-white/10 backdrop-blur-sm border-b border-white/20">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => navigate("/app")} className="text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="text-2xl">Submit Your Documents</CardTitle>
              <CardDescription>Complete the verification process in 4 simple steps</CardDescription>
              <Progress value={progress} className="mt-4" />
            </CardHeader>
            <CardContent>
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Step 1: Upload ID Document</h3>
                  <p className="text-muted-foreground">
                    Upload a clear photo of your government-issued ID (passport, driver's license, etc.)
                  </p>
                  {idFile ? (
                    <div className="space-y-4">
                      <img
                        src={URL.createObjectURL(idFile)}
                        alt="ID Preview"
                        className="w-full rounded-lg border"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIdFile(null)}
                          className="flex-1"
                        >
                          Change
                        </Button>
                        <Button
                          onClick={() => setStep(2)}
                          className="flex-1 bg-gradient-button"
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="id-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed border-primary rounded-lg p-12 text-center hover:bg-muted/50 transition-colors">
                          <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
                          <p className="text-lg font-medium">Click to upload</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            JPG, PNG, or WEBP (max 10MB)
                          </p>
                        </div>
                      </label>
                      <input
                        id="id-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleIdUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold">Step 2: Upload Selfie</h3>
                  <p className="text-muted-foreground">
                    Upload a clear selfie for identity verification
                  </p>
                  {selfieFile ? (
                    <div className="space-y-4">
                      <img
                        src={URL.createObjectURL(selfieFile)}
                        alt="Selfie Preview"
                        className="w-full rounded-lg border"
                      />
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setSelfieFile(null)}
                          className="flex-1"
                        >
                          Change
                        </Button>
                        <Button
                          onClick={() => setStep(3)}
                          className="flex-1 bg-gradient-button"
                        >
                          Continue
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <label htmlFor="selfie-upload" className="cursor-pointer">
                        <div className="border-2 border-dashed border-primary rounded-lg p-12 text-center hover:bg-muted/50 transition-colors">
                          <Upload className="w-12 h-12 mx-auto mb-4 text-primary" />
                          <p className="text-lg font-medium">Click to upload selfie</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            JPG, PNG, or WEBP (max 10MB)
                          </p>
                        </div>
                      </label>
                      <input
                        id="selfie-upload"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={handleSelfieUpload}
                        className="hidden"
                      />
                      <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                        Back
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">Step 3: Review & Verify</h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">ID Document</p>
                      {idFile && (
                        <img
                          src={URL.createObjectURL(idFile)}
                          alt="ID Preview"
                          className="w-full rounded-lg border"
                        />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-2">Selfie</p>
                      {selfieFile && (
                        <img
                          src={URL.createObjectURL(selfieFile)}
                          alt="Selfie Preview"
                          className="w-full rounded-lg border"
                        />
                      )}
                    </div>
                  </div>
                  {analyzing && (
                    <div className="bg-muted p-6 rounded-lg text-center">
                      <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3 text-primary" />
                      <p className="font-semibold text-lg">AI Verification in Progress...</p>
                      <p className="text-sm text-muted-foreground mt-2">Checking image quality, extracting data, and verifying authenticity</p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setStep(2)}
                      disabled={uploading}
                      className="flex-1"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={uploadFiles}
                      disabled={uploading}
                      className="flex-1 bg-gradient-button shadow-button"
                      size="lg"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        "Start Verification"
                      )}
                    </Button>
                  </div>
                </div>
              )}
              {step === 4 && verificationResult && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">Step 4: Verification Results</h3>
                  
                  {verificationResult.fraud_detected && (
                    <Alert variant="destructive">
                      <XCircle className="h-5 w-5" />
                      <AlertTitle>Fraud Detected</AlertTitle>
                      <AlertDescription>{verificationResult.fraud_reason}</AlertDescription>
                    </Alert>
                  )}

                  {!verificationResult.fraud_detected && verificationResult.face_match && (
                    <Alert className="border-green-500 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      <AlertTitle>Verification Successful</AlertTitle>
                      <AlertDescription>All checks passed successfully</AlertDescription>
                    </Alert>
                  )}

                  {!verificationResult.fraud_detected && !verificationResult.face_match && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-5 w-5" />
                      <AlertTitle>Face Mismatch</AlertTitle>
                      <AlertDescription>The selfie does not match the ID photo</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm font-medium mb-1">Image Quality</p>
                        <p className="text-2xl font-bold">{verificationResult.image_quality_score}%</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {verificationResult.image_quality_score >= 80 ? "Excellent" : 
                           verificationResult.image_quality_score >= 60 ? "Good" : "Poor"}
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <p className="text-sm font-medium mb-1">Face Match</p>
                        <p className="text-2xl font-bold">
                          {verificationResult.face_match ? (
                            <CheckCircle className="w-8 h-8 text-green-500" />
                          ) : (
                            <XCircle className="w-8 h-8 text-red-500" />
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {verificationResult.face_match_confidence}% confidence
                        </p>
                      </div>
                    </div>

                    {verificationResult.extracted_data && (
                      <div className="p-4 border rounded-lg space-y-2">
                        <p className="font-semibold mb-3">Extracted Information</p>
                        {verificationResult.extracted_data.name && (
                          <div>
                            <p className="text-xs text-muted-foreground">Full Name</p>
                            <p className="font-medium">{verificationResult.extracted_data.name}</p>
                          </div>
                        )}
                        {verificationResult.extracted_data.dob && (
                          <div>
                            <p className="text-xs text-muted-foreground">Date of Birth</p>
                            <p className="font-medium">{verificationResult.extracted_data.dob}</p>
                          </div>
                        )}
                        {verificationResult.extracted_data.id_number && (
                          <div>
                            <p className="text-xs text-muted-foreground">ID Number</p>
                            <p className="font-medium">{verificationResult.extracted_data.id_number}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => navigate("/app")}
                    className="w-full bg-gradient-button"
                    size="lg"
                  >
                    Go to Dashboard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
};

export default NewSubmission;
