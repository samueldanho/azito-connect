import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-destructive/10">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-3xl">Accès non autorisé</h1>
          <p className="text-muted-foreground">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            Contactez le Berger si vous pensez qu'il s'agit d'une erreur.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            Tableau de bord
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              await signOut();
              navigate("/auth", { replace: true });
            }}
          >
            Se déconnecter
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
