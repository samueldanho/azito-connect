import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChurchLogo } from "@/components/icons/ChurchLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, ArrowLeft, Bus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const BusCenter = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [zones, setZones] = useState<{ id: string; nom: string }[]>([]);

  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [heureDepart, setHeureDepart] = useState("");
  const [nombreAnciens, setNombreAnciens] = useState(0);
  const [nombreNouveaux, setNombreNouveaux] = useState(0);

  useEffect(() => {
    const fetchZones = async () => {
      const { data } = await supabase.functions.invoke("register-bus-center", {
        body: { action: "get_zones" },
      });
      if (data?.zones) setZones(data.zones);
    };
    fetchZones();
  }, []);

  const resetForm = () => {
    setNom("");
    setPrenom("");
    setZoneId("");
    setHeureDepart("");
    setNombreAnciens(0);
    setNombreNouveaux(0);
    setIsSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nom.trim() || nom.trim().length < 2) {
      toast({ title: "Erreur", description: "Le nom est requis (min 2 caractères)", variant: "destructive" });
      return;
    }
    if (!prenom.trim() || prenom.trim().length < 2) {
      toast({ title: "Erreur", description: "Le prénom est requis (min 2 caractères)", variant: "destructive" });
      return;
    }
    if (!heureDepart) {
      toast({ title: "Erreur", description: "L'heure de départ est requise", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await supabase.functions.invoke("register-bus-center", {
        body: {
          nom: nom.trim(),
          prenom: prenom.trim(),
          zone_id: zoneId || null,
          heure_depart: heureDepart,
          nombre_anciens: nombreAnciens,
          nombre_nouveaux: nombreNouveaux,
        },
      });

      if (response.error) throw response.error;
      if (response.data?.error) throw new Error(response.data.error);

      setIsSuccess(true);
    } catch (err) {
      toast({ title: "Erreur", description: (err instanceof Error ? err.message : "") || "Impossible d'enregistrer", variant: "destructive" });
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
            <h2 className="font-display text-2xl text-foreground">Enregistrement réussi !</h2>
            <p className="text-muted-foreground">
              Merci <span className="font-semibold text-foreground">{prenom} {nom}</span>, votre arrivée en bus-center a bien été enregistrée.
            </p>
            <div className="flex flex-col gap-3">
              <Button onClick={resetForm}>Enregistrer une autre personne</Button>
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
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <ChurchLogo size="lg" />
          </div>
          <h1 className="font-display text-3xl text-foreground mb-2">Bus-Center</h1>
          <p className="text-muted-foreground">Enregistrez votre arrivée pour le culte du dimanche</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 space-y-5">
          <div className="flex items-center gap-2 mb-2">
            <Bus className="w-5 h-5 text-primary" />
            <h3 className="font-display text-lg text-foreground">Informations du trajet</h3>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nom">Nom <span className="text-destructive">*</span></Label>
                <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Votre nom" className="mt-1" maxLength={100} required />
              </div>
              <div>
                <Label htmlFor="prenom">Prénom <span className="text-destructive">*</span></Label>
                <Input id="prenom" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Votre prénom" className="mt-1" maxLength={100} required />
              </div>
            </div>

            {zones.length > 0 && (
              <div>
                <Label>Zone</Label>
                <Select value={zoneId} onValueChange={setZoneId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Sélectionnez une zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => (
                      <SelectItem key={z.id} value={z.id}>{z.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="heureDepart">Heure de départ <span className="text-destructive">*</span></Label>
              <Input id="heureDepart" type="time" value={heureDepart} onChange={(e) => setHeureDepart(e.target.value)} className="mt-1" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="anciens">Nombre d'anciens</Label>
                <Input id="anciens" type="number" min={0} value={nombreAnciens} onChange={(e) => setNombreAnciens(Math.max(0, parseInt(e.target.value) || 0))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="nouveaux">Nombre de nouveaux</Label>
                <Input id="nouveaux" type="number" min={0} value={nombreNouveaux} onChange={(e) => setNombreNouveaux(Math.max(0, parseInt(e.target.value) || 0))} className="mt-1" />
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enregistrement en cours...</>
            ) : (
              "Enregistrer l'arrivée"
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Ces informations sont utilisées pour le suivi des bus-center de notre église.
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

export default BusCenter;
