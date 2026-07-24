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
import { QrCode, CheckCircle2, XCircle, Send } from "lucide-react";
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

export default function ScanPresence() {
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [activite, setActivite] = useState<TypeActivite>("culte");
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const lastScanRef = useRef<{ id: string; at: number } | null>(null);
  const processingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [manualToken, setManualToken] = useState("");

  const handleDecoded = async (decoded: string) => {
    if (processingRef.current) return;
    const id = decoded.trim();

    // Debounce identical scans (2s window)
    const now = Date.now();
    if (lastScanRef.current && lastScanRef.current.id === id && now - lastScanRef.current.at < 2000) {
      return;
    }
    lastScanRef.current = { id, at: now };

    if (!BADGE_RE.test(id)) {
      setLogs((l) => [
        { id: crypto.randomUUID(), name: "Badge non signé", time: new Date().toLocaleTimeString(), status: "error", message: "Ancien badge — régénérez-le depuis la fiche du membre" },
        ...l,
      ]);
      return;
    }

    processingRef.current = true;
    try {
      // Verify signature + expiration server-side
      const { data: verif, error: vErr } = await supabase.functions.invoke("verify-badge-token", {
        body: { token: id },
      });
      if (vErr || !verif?.valid) {
        setLogs((l) => [
          { id: crypto.randomUUID(), name: "Badge rejeté", time: new Date().toLocaleTimeString(), status: "error", message: verif?.reason || vErr?.message || "Invalide" },
          ...l,
        ]);
        return;
      }

      const { data: membre, error: mErr } = await supabase
        .from("membres")
        .select("id, nom_complet, service_id")
        .eq("id", verif.member_id)
        .maybeSingle();

      if (mErr || !membre) {
        setLogs((l) => [
          { id: crypto.randomUUID(), name: "Membre introuvable", time: new Date().toLocaleTimeString(), status: "error" },
          ...l,
        ]);
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
        setLogs((l) => [
          { id: crypto.randomUUID(), name: membre.nom_complet, time: new Date().toLocaleTimeString(), status: "duplicate", message: "Déjà marqué présent" },
          ...l,
        ]);
        return;
      }

      const payload = {
        membre_id: membre.id,
        date_presence: date,
        type_activite: activite,
        est_present: true,
        service_id: membre.service_id,
      };

      const { error: upErr } = existing
        ? await supabase.from("presences").update({ est_present: true }).eq("id", existing.id)
        : await supabase.from("presences").insert(payload);

      if (upErr) {
        setLogs((l) => [
          { id: crypto.randomUUID(), name: membre.nom_complet, time: new Date().toLocaleTimeString(), status: "error", message: upErr.message },
          ...l,
        ]);
        return;
      }

      setLogs((l) => [
        { id: crypto.randomUUID(), name: membre.nom_complet, time: new Date().toLocaleTimeString(), status: "ok" },
        ...l,
      ]);
    } finally {
      processingRef.current = false;
    }
  };

  const handleFileUpload = async (file: File) => {
    const scanner = new Html5Qrcode("qr-reader-file", { verbose: false } as any);
    try {
      const decoded = await scanner.scanFile(file, true);
      await handleDecoded(decoded);
    } catch (e: any) {
      toast({
        title: "QR non détecté",
        description: e?.message || "Aucun QR code lisible dans l'image.",
        variant: "destructive",
      });
    } finally {
      try {
        await scanner.clear();
      } catch {}
    }
  };

  const handleManualSubmit = async () => {
    const t = manualToken.trim();
    if (!t) return;
    await handleDecoded(t);
    setManualToken("");
  };

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
                Importez une image QR ou collez le token du badge pour enregistrer la présence.
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
                <div id="qr-reader-file" className="hidden" />

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">Importer une image QR</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choisir une image
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Coller le token du badge</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={manualToken}
                        onChange={(e) => setManualToken(e.target.value)}
                        placeholder="BADGE.v1...."
                        onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
                      />
                      <Button type="button" onClick={handleManualSubmit} disabled={!manualToken.trim()}>
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
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
