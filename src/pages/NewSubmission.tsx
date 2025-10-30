import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Upload, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import ProtectedRoute from "@/components/ProtectedRoute";

const NewSubmission = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

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

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      toast.error("Failed to access camera");
      console.error(error);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takeSelfie = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });
            setSelfieFile(file);
            stopCamera();
          }
        }, "image/jpeg");
      }
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
        const { data: aiResult } = await supabase.functions.invoke("analyze-kyc", {
          body: {
            submission_id: submission.id,
            id_image_path: idPath,
            selfie_image_path: selfiePath,
          },
        });

        console.log("AI Analysis completed:", aiResult);
      } catch (aiError) {
        console.error("AI analysis failed:", aiError);
        // Don't fail the submission if AI analysis fails
      }

      toast.success("Documents submitted successfully!");
      navigate("/app");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit documents");
      console.error(error);
    } finally {
      setUploading(false);
      setAnalyzing(false);
    }
  };

  const progress = (step / 3) * 100;

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
              <CardDescription>Complete the verification process in 3 simple steps</CardDescription>
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
                  <h3 className="text-xl font-semibold">Step 2: Take a Selfie</h3>
                  <p className="text-muted-foreground">
                    Take a clear selfie for identity verification
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
                          onClick={() => {
                            setSelfieFile(null);
                            startCamera();
                          }}
                          className="flex-1"
                        >
                          Retake
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
                      {stream ? (
                        <div>
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full rounded-lg border"
                          />
                          <Button
                            onClick={takeSelfie}
                            className="w-full mt-4 bg-gradient-button"
                            size="lg"
                          >
                            <Camera className="w-5 h-5 mr-2" />
                            Capture Selfie
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={startCamera}
                          className="w-full bg-gradient-button"
                          size="lg"
                        >
                          <Camera className="w-5 h-5 mr-2" />
                          Start Camera
                        </Button>
                      )}
                      <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                        Back
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-xl font-semibold">Step 3: Review & Submit</h3>
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
                    <div className="bg-muted p-4 rounded-lg text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                      <p className="font-medium">AI is analyzing your documents...</p>
                      <p className="text-sm text-muted-foreground">This may take a few moments</p>
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
                          Submitting...
                        </>
                      ) : (
                        "Submit Documents"
                      )}
                    </Button>
                  </div>
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
