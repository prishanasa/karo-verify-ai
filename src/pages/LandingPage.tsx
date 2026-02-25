import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Upload,
  Brain,
  ShieldAlert,
  Eye,
  FileText,
  Cpu,
  Zap,
  Monitor,
  Server,
  Database,
  ArrowRight,
  Scan,
} from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Scan className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              KYC-Karo
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo("features")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</button>
            <button onClick={() => scrollTo("how-it-works")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</button>
            <button onClick={() => scrollTo("ai-pipeline")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">AI Pipeline</button>
            <button onClick={() => scrollTo("system")} className="text-sm text-muted-foreground hover:text-foreground transition-colors">Demo</button>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
            Login
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-[0.07]" />
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-[100px]" />
        <div className="relative max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium tracking-wide uppercase">
            <Cpu className="h-3.5 w-3.5" /> Deep Learning · Computer Vision · OCR
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
            <span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
              KYC-Karo
            </span>
            <br />
            <span className="text-foreground text-3xl md:text-4xl font-semibold">
              AI-Powered Identity Verification System
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            An AI-driven KYC platform that automates identity verification using computer vision, OCR, and deep learning to reduce processing time from days to minutes.
          </p>
          <p className="italic text-muted-foreground/80 text-sm md:text-base">
            "Transforming manual verification into intelligent, real-time AI decisions."
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button
              size="lg"
              className="bg-gradient-button shadow-button text-primary-foreground px-8 rounded-xl"
              onClick={() => scrollTo("how-it-works")}
            >
              View How It Works <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="rounded-xl px-8" onClick={() => navigate("/auth")}>
              Login to Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            Three simple steps from document upload to verified identity.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Upload,
                title: "Document Upload",
                desc: "Users upload ID proof and personal details through a secure, intuitive interface.",
                step: "01",
              },
              {
                icon: Brain,
                title: "AI Processing",
                desc: "Deep learning model + OCR extract and validate identity data in real-time.",
                step: "02",
              },
              {
                icon: ShieldAlert,
                title: "Fraud Risk Analysis",
                desc: "Hybrid model (CNN + Fuzzy Logic) generates a contextual risk score for each submission.",
                step: "03",
              },
            ].map((item) => (
              <Card
                key={item.step}
                className="relative overflow-hidden border-border/50 bg-card shadow-card hover:shadow-lg transition-all duration-300 rounded-2xl group"
              >
                <div className="absolute top-4 right-4 text-6xl font-black text-primary/5 group-hover:text-primary/10 transition-colors">
                  {item.step}
                </div>
                <CardContent className="p-8 space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-button flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Banner */}
      <section className="py-12 px-6 bg-gradient-hero">
        <p className="text-center text-primary-foreground text-lg md:text-xl font-medium italic max-w-3xl mx-auto">
          "From days of manual verification to minutes with AI automation."
        </p>
      </section>

      {/* AI Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" id="ai-pipeline">AI Features &amp; Pipeline</h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            Advanced AI capabilities powering every verification decision.
          </p>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Eye,
                title: "Facial Similarity Detection",
                desc: "Computer Vision–based facial matching using CNN architectures (VGG-Face / DeepFace) to compare selfies with ID photos.",
              },
              {
                icon: FileText,
                title: "OCR Data Extraction",
                desc: "Automated text extraction from ID documents using OCR engines, parsing names, dates, and document numbers with high accuracy.",
              },
              {
                icon: Cpu,
                title: "Hybrid Fraud Detection",
                desc: "Combines deep learning feature extraction with fuzzy logic rules to generate contextual, explainable fraud risk scores.",
              },
              {
                icon: Zap,
                title: "Real-Time Verification",
                desc: "End-to-end processing in minutes instead of days, dramatically reducing manual review overhead and operational costs.",
              },
            ].map((item, i) => (
              <Card
                key={i}
                className="border-border/50 bg-gradient-card shadow-card hover:shadow-lg transition-all duration-300 rounded-2xl"
              >
                <CardContent className="p-8 flex gap-5">
                  <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-button flex items-center justify-center">
                    <item.icon className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* System Overview */}
      <section id="system" className="py-24 px-6 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">System Overview</h2>
          <p className="text-muted-foreground text-center mb-16 max-w-xl mx-auto">
            A full-stack architecture built for security, speed, and scalability.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Monitor,
                title: "Frontend",
                desc: "React dashboard for user interaction, document uploads, and real-time status tracking.",
              },
              {
                icon: Server,
                title: "Backend",
                desc: "AI inference pipeline handling face matching, OCR validation, and risk scoring via edge functions.",
              },
              {
                icon: Database,
                title: "Database",
                desc: "Secure storage for verification records, audit logs, and encrypted user data.",
              },
            ].map((item, i) => (
              <Card key={i} className="border-border/50 bg-card shadow-card rounded-2xl hover:shadow-lg transition-all duration-300 text-center">
                <CardContent className="p-8 space-y-4 flex flex-col items-center">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-button flex items-center justify-center">
                    <item.icon className="h-7 w-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero opacity-[0.05]" />
        <div className="relative max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl md:text-4xl font-bold">Experience AI-Powered KYC Verification</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            See how deep learning, computer vision, and OCR come together to automate identity verification and fraud detection.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-gradient-button shadow-button text-primary-foreground px-8 rounded-xl" onClick={() => scrollTo("how-it-works")}>
              View Demo
            </Button>
            <Button variant="outline" size="lg" className="rounded-xl px-8" onClick={() => navigate("/auth")}>
              Login to Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Scan className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">KYC-Karo</span>
          </div>
          <p>AI-Powered Identity Verification · Deep Learning · Computer Vision · OCR</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
