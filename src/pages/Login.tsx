import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChurchLogo } from "@/components/icons/ChurchLogo";
import { Eye, EyeOff, Users, Shield, ChevronRight } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginType, setLoginType] = useState<"berger" | "responsable">("berger");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login - will be replaced with Supabase auth
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen gradient-hero flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-sidebar relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-40 right-20 w-48 h-48 rounded-full bg-accent blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col justify-center px-12 lg:px-16">
          <div className="flex items-center gap-4 mb-8">
            <ChurchLogo size="lg" />
            <div>
              <h1 className="font-display text-3xl text-sidebar-foreground">
                Mon Église
              </h1>
              <span className="text-sidebar-primary font-semibold text-xl">
                Connect
              </span>
            </div>
          </div>
          
          <h2 className="font-display text-4xl lg:text-5xl text-sidebar-foreground mb-6 leading-tight">
            Gérez votre communauté avec{" "}
            <span className="text-sidebar-primary">simplicité</span>
          </h2>
          
          <p className="text-sidebar-foreground/70 text-lg mb-12 max-w-md">
            Une plateforme moderne pour la gestion des membres, des présences et 
            des statistiques de votre église.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sidebar-accent flex items-center justify-center">
                <Users className="w-6 h-6 text-sidebar-primary" />
              </div>
              <div>
                <h3 className="text-sidebar-foreground font-medium">Gestion des membres</h3>
                <p className="text-sidebar-foreground/60 text-sm">Centralisez toutes vos données</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sidebar-accent flex items-center justify-center">
                <Shield className="w-6 h-6 text-sidebar-primary" />
              </div>
              <div>
                <h3 className="text-sidebar-foreground font-medium">Sécurité renforcée</h3>
                <p className="text-sidebar-foreground/60 text-sm">Protection des données personnelles</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <ChurchLogo size="md" />
            <div>
              <h1 className="font-display text-2xl text-foreground">Mon Église</h1>
              <span className="text-primary font-semibold">Connect</span>
            </div>
          </div>

          <div className="glass-card p-8">
            <div className="text-center mb-8">
              <h2 className="font-display text-2xl text-foreground mb-2">
                Bienvenue
              </h2>
              <p className="text-muted-foreground">
                Connectez-vous pour accéder à votre espace
              </p>
            </div>

            {/* Login Type Selector */}
            <div className="flex gap-2 p-1 bg-secondary rounded-xl mb-6">
              <button
                onClick={() => setLoginType("berger")}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                  loginType === "berger"
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Berger
              </button>
              <button
                onClick={() => setLoginType("responsable")}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${
                  loginType === "responsable"
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Responsable
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="identifier" className="text-foreground">
                  {loginType === "berger" ? "Identifiant" : "Code d'accès"}
                </Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder={loginType === "berger" ? "Votre identifiant" : "Votre code personnel"}
                  className="h-12 bg-background border-border focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-12 bg-background border-border focus:border-primary pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Connexion...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Se connecter
                    <ChevronRight className="w-5 h-5" />
                  </span>
                )}
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Problème de connexion ?{" "}
              <a href="#" className="text-primary hover:underline font-medium">
                Contactez l'administrateur
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
