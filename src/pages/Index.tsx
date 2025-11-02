import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
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
      } else {
        navigate("/auth");
      }
    };
    
    checkAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

export default Index;
