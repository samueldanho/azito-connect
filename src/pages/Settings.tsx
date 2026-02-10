import { useState } from "react";
import { cn } from "@/lib/utils";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { User, Lock, Shield } from "lucide-react";

const Settings = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["user-roles", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      if (error) throw error;
      return data?.map((r) => r.role) ?? [];
    },
    enabled: !!user,
  });

  const [nomComplet, setNomComplet] = useState("");
  const [telephone, setTelephone] = useState("");
  const [initialized, setInitialized] = useState(false);

  if (profile && !initialized) {
    setNomComplet(profile.nom_complet || "");
    setTelephone(profile.telephone || "");
    setInitialized(true);
  }

  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from("profiles")
        .update({ nom_complet: nomComplet, telephone })
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast({ title: "Profil mis à jour", description: "Vos informations ont été enregistrées." });
    },
    onError: () => {
      toast({ title: "Erreur", description: "Impossible de mettre à jour le profil.", variant: "destructive" });
    },
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const changePassword = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) throw new Error("Les mots de passe ne correspondent pas");
      if (newPassword.length < 6) throw new Error("Le mot de passe doit contenir au moins 6 caractères");
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Mot de passe modifié", description: "Votre mot de passe a été mis à jour." });
    },
    onError: (err: Error) => {
      toast({ title: "Erreur", description: err.message, variant: "destructive" });
    },
  });

  const roleLabels: Record<string, string> = {
    berger: "Berger (Administrateur)",
    responsable_service: "Responsable de service",
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="hidden lg:block">
        <DashboardSidebar isCollapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      </div>
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <DashboardSidebar isCollapsed={false} onToggle={() => setMobileMenuOpen(false)} />
        </div>
      )}

      <div className={cn("transition-all duration-300", sidebarCollapsed ? "lg:ml-20" : "lg:ml-64")}>
        <DashboardHeader onMenuClick={() => setMobileMenuOpen(true)} />

        <main className="p-4 lg:p-6 max-w-3xl">
          <div className="mb-6">
            <h1 className="font-display text-3xl text-foreground mb-1">Paramètres</h1>
            <p className="text-muted-foreground text-sm">Gérez votre profil et vos préférences</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile" className="gap-1.5"><User className="w-4 h-4" />Profil</TabsTrigger>
              <TabsTrigger value="security" className="gap-1.5"><Lock className="w-4 h-4" />Sécurité</TabsTrigger>
              <TabsTrigger value="roles" className="gap-1.5"><Shield className="w-4 h-4" />Rôles</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="glass-card p-6 space-y-5">
                <h3 className="font-display text-lg text-foreground">Informations personnelles</h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user?.email ?? ""} disabled className="mt-1 bg-muted" />
                  </div>

                  <div>
                    <Label htmlFor="nomComplet">Nom complet</Label>
                    <Input id="nomComplet" value={nomComplet} onChange={(e) => setNomComplet(e.target.value)} className="mt-1" placeholder="Votre nom complet" />
                  </div>

                  <div>
                    <Label htmlFor="telephone">Téléphone</Label>
                    <Input id="telephone" value={telephone} onChange={(e) => setTelephone(e.target.value)} className="mt-1" placeholder="+225 00 00 00 00" />
                  </div>
                </div>

                <Button onClick={() => updateProfile.mutate()} disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
              </div>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <div className="glass-card p-6 space-y-5">
                <h3 className="font-display text-lg text-foreground">Changer le mot de passe</h3>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                    <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="mt-1" placeholder="••••••••" />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                    <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="mt-1" placeholder="••••••••" />
                  </div>
                </div>

                <Button onClick={() => changePassword.mutate()} disabled={changePassword.isPending} variant="destructive">
                  {changePassword.isPending ? "Modification..." : "Modifier le mot de passe"}
                </Button>
              </div>

              <div className="glass-card p-6 mt-6 space-y-4">
                <h3 className="font-display text-lg text-foreground">Session</h3>
                <p className="text-sm text-muted-foreground">Vous êtes connecté en tant que <span className="font-medium text-foreground">{user?.email}</span></p>
                <Button variant="outline" onClick={signOut}>Se déconnecter</Button>
              </div>
            </TabsContent>

            {/* Roles Tab */}
            <TabsContent value="roles">
              <div className="glass-card p-6 space-y-4">
                <h3 className="font-display text-lg text-foreground">Vos rôles</h3>
                {roles.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun rôle assigné.</p>
                ) : (
                  <div className="space-y-2">
                    {roles.map((role) => (
                      <div key={role} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                        <Shield className="w-5 h-5 text-primary" />
                        <span className="font-medium text-foreground">{roleLabels[role] || role}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">Les rôles sont gérés par le Berger (administrateur). Contactez-le pour toute modification.</p>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Settings;
