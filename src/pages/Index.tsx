import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, Upload, Search, Shield, Clock } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (profile?.role === "teacher") {
          navigate("/teacher");
        } else if (profile?.role === "student") {
          navigate("/student");
        }
      }
      
      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        checkAuth();
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-primary/80 rounded-3xl mb-4">
            <BookOpen className="w-10 h-10 text-primary-foreground" />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              ClassNotes
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your daily classroom notes, organized and accessible for 365 days.
              Teachers upload, students access, everyone learns better.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="text-lg px-8 py-6"
            >
              Get Started
              <GraduationCap className="w-5 h-5 ml-2" />
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mt-16 text-left">
            <div className="p-6 rounded-xl bg-card border hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Upload className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Easy Upload</h3>
              <p className="text-sm text-muted-foreground">
                Teachers can quickly scan or upload daily notes with automatic organization
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Quick Search</h3>
              <p className="text-sm text-muted-foreground">
                Find any note instantly by date, title, or tags
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">365-Day Access</h3>
              <p className="text-sm text-muted-foreground">
                All notes available for exactly one year from upload date
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;