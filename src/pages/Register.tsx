import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChurchLogo } from "@/components/icons/ChurchLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ArrowLeft, UserPlus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const Register = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [services, setServices] = useState<{ id: string; nom: string }[]>([]);

  const [nomComplet, setNomComplet] = useState("");
  const [telephone, setTelephone] = useState("");
  const [lieuHabitation, setLieuHabitation] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [statutBapteme, setStatutBapteme] = useState("non_baptise");

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase.from("services").select("id, nom").order("nom");
      if (data) setServices(data);
    };
    fetchServices();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nomComplet.trim() || nomComplet.trim().length < 2) {
      toast({ title: "Erreur", description: "Le nom complet est requis (min 2 caractères)", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await supabase.functions.invoke("register-member", {
        body: {
          nom_complet: nomComplet.trim(),
          telephone: telephone.trim() || null,
          lieu_habitation: lieuHabitation.trim() || null,
          service_id: serviceId || null,
          statut_bapteme: statutBapteme,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      setIsSuccess(true);
    } catch (err: any) {
      toast({ title: "Erreur", description: err.message || "Impossible de s'inscrire", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center animate-scale-in">
          <div className="glass-card p-8 space-y-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-[hsl(145,50%,35%)]/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-[hsl(145,50%,35%)]" />
            </div>
            <h2 className="font-display text-2xl text-foreground">Inscription réussie !</h2>
            <p className="text-muted-foreground">
              Merci <span className="font-semibold text-foreground">{nomComplet}</span>, votre inscription a bien été enregistrée. Bienvenue dans notre communauté !
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={() => { setIsSuccess(false); setNomComplet(""); setTelephone(""); setLieuHabitation(""); setServiceId(""); setStatutBapteme("non_baptise"); }}>
                Inscrire une autre personne
              </Button>
              <Link to="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="w-4 h-4 mr-2" /> Retour à l'accueil
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ChurchLogo size="lg" />
          </div>
          <h1 className="font-display text-3xl text-foreground mb-2">Inscription Membre</h1>
          <p className="text-muted-foreground">Rejoignez notre communauté en remplissant ce formulaire</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg text-foreground">Vos informations</h3>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="nomComplet">Nom complet <span className="text-destructive">*</span></Label>
              <Input
                id="nomComplet"
                value={nomComplet}
                onChange={(e) => setNomComplet(e.target.value)}
                placeholder="Entrez votre nom complet"
                className="mt-1"
                maxLength={100}
                required
              />
            </div>

            <div>
              <Label htmlFor="telephone">Téléphone</Label>
              <Input
                id="telephone"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                placeholder="+225 00 00 00 00"
                className="mt-1"
                maxLength={20}
              />
            </div>

            <div>
              <Label htmlFor="lieu">Lieu d'habitation</Label>
              <Input
                id="lieu"
                value={lieuHabitation}
                onChange={(e) => setLieuHabitation(e.target.value)}
                placeholder="Votre quartier ou commune"
                className="mt-1"
                maxLength={100}
              />
            </div>

            <div>
              <Label htmlFor="service">Service souhaité</Label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Choisir un service (optionnel)" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="bapteme">Statut de baptême</Label>
              <Select value={statutBapteme} onValueChange={setStatutBapteme}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baptise">Baptisé(e)</SelectItem>
                  <SelectItem value="non_baptise">Non baptisé(e)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Inscription en cours...</>
            ) : (
              "S'inscrire"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            En vous inscrivant, vous acceptez que vos informations soient utilisées dans le cadre de la gestion de notre église.
          </p>
        </form>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-primary hover:underline">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
