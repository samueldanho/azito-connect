import { useRef, useState } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QrCode, CheckCircle2, XCircle, Send, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TypeActivite } from "@/hooks/usePresences";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ScanLog {
  id: string;
  name: string;
  time: string;
  status: "ok" | "duplicate" | "error";
  message?: string;
}

const BADGE_RE = /^BADGE\.v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

type TokenState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "invalid"; title: string; detail: string }
  | { kind: "valid"; title: string; detail: string };

// Traduit les raisons renvoyées par la fonction de vérification en messages clairs
function explainReason(reason?: string): { title: string; detail: string } {
  const r = (reason || "").toLowerCase();
  if (r.includes("expir")) {
    return {
      title: "Token expiré",
      detail: "Ce badge a dépassé sa durée de validité. Régénérez-le depuis la fiche du membre.",
    };
  }
  if (r.includes("signature")) {
    return {
      title: "Token invalide",
      detail: "La signature du badge est incorrecte : badge falsifié ou généré avec une autre clé.",
    };
  }
  if (r.includes("format")) {
    return {
      title: "Token invalide",
      detail: "Format non reconnu — il s'agit probablement d'un ancien badge non signé.",
    };
  }
  if (r.includes("payload") || r.includes("identifiant")) {
    return {
      title: "Token invalide",
      detail: "Le contenu du badge est illisible ou corrompu.",
    };
  }
  if (r.includes("unauthorized")) {
    return {
      title: "Session expirée",
      detail: "Reconnectez-vous pour pouvoir vérifier les badges.",
    };
  }
  if (r.includes("config")) {
    return {
      title: "Configuration manquante",
      detail: "La clé de signature des badges n'est pas configurée côté serveur.",
    };
  }
  return {
    title: "Token invalide ou expiré",
    detail: reason || "Vérification impossible. Réessayez ou régénérez le badge.",
  };
}

export default function ScanPresence() {
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [activite, setActivite] = useState<TypeActivite>("culte");
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const lastScanRef = useRef<{ id: string; at: number } | null>(null);
  const processingRef = useRef(false);
  const [manualToken, setManualToken] = useState("");
  const [tokenState, setTokenState] = useState<TokenState>({ kind: "idle" });

  const pushLog = (log: Omit<ScanLog, "id" | "time">) =>
    setLogs((l) => [
      { id: crypto.randomUUID(), time: new Date().toLocaleTimeString(), ...log },
      ...l,
    ]);

  const handleDecoded = async (decoded: string) => {
    if (processingRef.current) return;
    const id = decoded.trim();

    // Validation locale du format avant tout appel réseau
    if (!id) {
      setTokenState({ kind: "invalid", title: "Token vide", detail: "Collez le token du badge avant de valider." });
      return;
    }
    if (!BADGE_RE.test(id)) {
      const detail = id.startsWith("BADGE.")
        ? "Structure du token incorrecte (attendu : BADGE.v1.<payload>.<signature>)."
        : "Ce code n'est pas un badge signé — régénérez-le depuis la fiche du membre.";
      setTokenState({ kind: "invalid", title: "Token invalide", detail });
      pushLog({ name: "Badge non signé", status: "error", message: detail });
      return;
    }

    // Debounce identical scans (2s window)
    const now = Date.now();
    if (lastScanRef.current && lastScanRef.current.id === id && now - lastScanRef.current.at < 2000) {
      return;
    }
    lastScanRef.current = { id, at: now };

    processingRef.current = true;
    setTokenState({ kind: "checking" });
    try {
      // Verify signature + expiration server-side
      const { data: verif, error: vErr } = await supabase.functions.invoke("verify-badge-token", {
        body: { token: id },
      });
      if (vErr || !verif?.valid) {
        const { title, detail } = explainReason(verif?.reason || vErr?.message);
        setTokenState({ kind: "invalid", title, detail });
        pushLog({ name: "Badge rejeté", status: "error", message: `${title} — ${detail}` });
        return;
      }

      const { data: membre, error: mErr } = await supabase
        .from("membres")
        .select("id, nom_complet, service_id")
        .eq("id", verif.member_id)
        .maybeSingle();

      if (mErr || !membre) {
        const detail = "Aucun membre ne correspond à ce badge (membre supprimé ou hors de votre périmètre).";
        setTokenState({ kind: "invalid", title: "Membre introuvable", detail });
        pushLog({ name: "Membre introuvable", status: "error", message: detail });
        return;
      }

      // Check if already present
      const { data: existing } = await supabase
        .from("presences")
        .select("id, est_present")
        .eq("membre_id", membre.id)
        .eq("date_presence", date)
        .eq("type_activite", activite)
        .maybeSingle();

      if (existing?.est_present) {
        setTokenState({
          kind: "valid",
          title: `${membre.nom_complet} — déjà présent`,
          detail: "La présence était déjà enregistrée pour cette date et cette activité.",
        });
        pushLog({ name: membre.nom_complet, status: "duplicate", message: "Déjà marqué présent" });
        return;
      }

      if (!membre.service_id) {
        const detail = "Ce membre n'est affecté à aucun service : affectez-le avant d'enregistrer sa présence.";
        setTokenState({ kind: "invalid", title: "Service manquant", detail });
        pushLog({ name: membre.nom_complet, status: "error", message: detail });
        return;
      }

      const { data: auth } = await supabase.auth.getUser();

      const payload = {
        membre_id: membre.id,
        date_presence: date,
        type_activite: activite,
        est_present: true,
        service_id: membre.service_id,
        marked_by: auth.user?.id ?? null,
      };

      const { error: upErr } = existing
        ? await supabase
            .from("presences")
            .update({ est_present: true, marked_by: auth.user?.id ?? null })
            .eq("id", existing.id)
        : await supabase.from("presences").insert(payload);

      if (upErr) {
        const detail = upErr.message.toLowerCase().includes("row-level")
          ? "Vous n'avez pas les droits pour enregistrer la présence de ce membre."
          : upErr.message;
        setTokenState({ kind: "invalid", title: "Enregistrement refusé", detail });
        pushLog({ name: membre.nom_complet, status: "error", message: detail });
        return;
      }


      setTokenState({
        kind: "valid",
        title: `${membre.nom_complet} — présence enregistrée`,
        detail: `Badge valide • ${date} • ${activite}`,
      });
      pushLog({ name: membre.nom_complet, status: "ok" });
      setManualToken("");
    } catch (e) {
      const detail = (e as Error).message || "Erreur réseau pendant la vérification du badge.";
      setTokenState({ kind: "invalid", title: "Vérification impossible", detail });
      pushLog({ name: "Erreur", status: "error", message: detail });
    } finally {
      processingRef.current = false;
    }
  };




  const handleManualSubmit = async () => {
    const t = manualToken.trim();
    if (!t) {
      setTokenState({ kind: "invalid", title: "Token vide", detail: "Collez le token du badge avant de valider." });
      return;
    }
    await handleDecoded(t);
  };

  const formatLooksValid = BADGE_RE.test(manualToken.trim());
  const okCount = logs.filter((l) => l.status === "ok").length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={cn("transition-all duration-300", sidebarCollapsed ? "ml-20" : "ml-64")}>
        <DashboardHeader onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-semibold">Scan présence rapide</h1>
              <p className="text-sm text-muted-foreground">
                Collez le token du badge pour enregistrer la présence.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="w-5 h-5" />
                  Badge QR
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 mb-4">
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="activite">Activité</Label>
                    <Select
                      value={activite}
                      onValueChange={(v) => setActivite(v as TypeActivite)}
                    >
                      <SelectTrigger id="activite">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="culte">Culte</SelectItem>
                        <SelectItem value="reunion">Réunion</SelectItem>
                        <SelectItem value="activite_speciale">Activité spéciale</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Coller le token du badge</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={manualToken}
                      onChange={(e) => {
                        setManualToken(e.target.value);
                        setTokenState({ kind: "idle" });
                      }}
                      placeholder="BADGE.v1...."
                      aria-invalid={tokenState.kind === "invalid"}
                      className={cn(
                        tokenState.kind === "invalid" && "border-destructive focus-visible:ring-destructive"
                      )}
                      onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                    />
                    <Button
                      type="button"
                      onClick={handleManualSubmit}
                      disabled={!manualToken.trim() || tokenState.kind === "checking"}
                    >
                      {tokenState.kind === "checking" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {manualToken.trim() && !formatLooksValid && tokenState.kind === "idle" && (
                    <p className="text-xs text-amber-600 mt-1.5">
                      Format attendu : BADGE.v1.&lt;payload&gt;.&lt;signature&gt;
                    </p>
                  )}

                  {tokenState.kind === "checking" && (
                    <div className="mt-3 flex items-center gap-2 p-3 rounded-md border bg-muted/40 text-sm">
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground">Vérification du token (signature et expiration)…</span>
                    </div>
                  )}

                  {tokenState.kind === "invalid" && (
                    <div className="mt-3 flex items-start gap-2 p-3 rounded-md border border-destructive/30 bg-destructive/5">
                      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-destructive">{tokenState.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{tokenState.detail}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Aucune présence n'a été enregistrée.
                        </p>
                      </div>
                    </div>
                  )}

                  {tokenState.kind === "valid" && (
                    <div className="mt-3 flex items-start gap-2 p-3 rounded-md border border-success/30 bg-success/5">
                      <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium">{tokenState.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{tokenState.detail}</p>
                      </div>
                    </div>
                  )}
                </div>


              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Journal</span>
                  <Badge variant="secondary">{okCount} présent{okCount > 1 ? "s" : ""}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Aucun scan pour l'instant.
                  </p>
                ) : (
                  <ul className="space-y-2 max-h-[520px] overflow-y-auto">
                    {logs.map((log) => (
                      <li
                        key={log.id}
                        className={cn(
                          "flex items-start gap-2 p-2 rounded-md border",
                          log.status === "ok" && "border-success/30 bg-success/5",
                          log.status === "duplicate" && "border-amber-500/30 bg-amber-500/5",
                          log.status === "error" && "border-destructive/30 bg-destructive/5"
                        )}
                      >
                        {log.status === "ok" ? (
                          <CheckCircle2 className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
                        ) : (
                          <XCircle
                            className={cn(
                              "w-4 h-4 mt-0.5 flex-shrink-0",
                              log.status === "duplicate" ? "text-amber-600" : "text-destructive"
                            )}
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{log.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {log.time}
                            {log.message ? ` • ${log.message}` : ""}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
