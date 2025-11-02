import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: userRole } = await supabase
          .from("user_roles" as any)
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        const isAdmin = !!userRole;
        
        if (isAdmin) {
          navigate("/admin");
        } else {
          navigate("/app");
        }
      }
    };
    checkSession();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate inputs
      authSchema.parse({ email, password });

      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          const { data: userRole } = await supabase
            .from("user_roles" as any)
            .select("role")
            .eq("user_id", data.user.id)
            .eq("role", "admin")
            .maybeSingle();

          const isAdmin = !!userRole;

          toast.success("Welcome back!");
          
          if (isAdmin) {
            navigate("/admin");
          } else {
            navigate("/app");
          }
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              role: role,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          toast.success("Account created! Redirecting...");
          
          // Wait a moment for the user_roles to be created by trigger
          setTimeout(async () => {
            const { data: userRole } = await supabase
              .from("user_roles" as any)
              .select("role")
              .eq("user_id", data.user!.id)
              .eq("role", "admin")
              .maybeSingle();

            const isAdmin = !!userRole;

            if (isAdmin) {
              navigate("/admin");
            } else {
              navigate("/app");
            }
          }, 1000);
        }
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error(error.message || "Authentication failed");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">KYC-Karo</h1>
          <p className="text-xl text-white/90 mb-1">KYC Made Easy</p>
          <p className="text-lg text-white/80">From Days to Minutes</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          <div className="flex gap-2 mb-6">
            <Button
              type="button"
              variant={isLogin ? "default" : "outline"}
              className="flex-1"
              onClick={() => setIsLogin(true)}
            >
              Login
            </Button>
            <Button
              type="button"
              variant={!isLogin ? "default" : "outline"}
              className="flex-1"
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </Button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {!isLogin && (
              <div className="space-y-3">
                <Label>I am...</Label>
                <RadioGroup value={role} onValueChange={setRole}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="user" id="user" />
                    <Label htmlFor="user" className="flex-1 cursor-pointer">
                      Submitting my documents
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <RadioGroupItem value="admin" id="admin" />
                    <Label htmlFor="admin" className="flex-1 cursor-pointer">
                      A business admin
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-gradient-button shadow-button"
              disabled={loading}
            >
              {loading ? "Please wait..." : isLogin ? "Login" : "Sign Up"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Auth;
