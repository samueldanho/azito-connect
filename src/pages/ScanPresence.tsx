import { useEffect, useRef, useState } from "react";
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
import { QrCode, Camera, CheckCircle2, XCircle, Play, Square } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { TypeActivite } from "@/hooks/usePresences";
import { useToast } from "@/hooks/use-toast";
import { Html5Qrcode } from "html5-qrcode";
import { cn } from "@/lib/utils";

interface ScanLog {
  id: string;
  name: string;
  time: string;
  status: "ok" | "duplicate" | "error";
  message?: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ScanPresence() {
  const { toast } = useToast();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [activite, setActivite] = useState<TypeActivite>("culte");
  const [scanning, setScanning] = useState(false);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ id: string; at: number } | null>(null);
  const processingRef = useRef(false);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  const handleDecoded = async (decoded: string) => {
    if (processingRef.current) return;
    const id = decoded.trim();

    // Debounce identical scans (2s window)
    const now = Date.now();
    if (lastScanRef.current && lastScanRef.current.id === id && now - lastScanRef.current.at < 2000) {
      return;
    }
    lastScanRef.current = { id, at: now };

    if (!UUID_RE.test(id)) {
      setLogs((l) => [
        { id: crypto.randomUUID(), name: "QR invalide", time: new Date().toLocaleTimeString(), status: "error", message: "Format non reconnu" },
        ...l,
      ]);
      return;
    }

    processingRef.current = true;
    try {
      const { data: membre, error: mErr } = await supabase
        .from("membres")
        .select("id, nom_complet, service_id")
        .eq("id", id)
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

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decoded) => {
          handleDecoded(decoded);
        },
        () => {}
      );
      setScanning(true);
    } catch (e: any) {
      toast({
        title: "Impossible d'accéder à la caméra",
        description: e?.message || "Vérifiez les permissions du navigateur.",
        variant: "destructive",
      });
      scannerRef.current = null;
      setScanning(false);
    }
  };

  const okCount = logs.filter((l) => l.status === "ok").length;

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={cn("transition-all duration-300", sidebarCollapsed ? "ml-20" : "ml-64")}>
        <DashboardHeader />
        <main className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-semibold">Scan présence rapide</h1>
              <p className="text-sm text-muted-foreground">
                Scannez le QR code du membre pour l'enregistrer présent.
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Caméra
                </CardTitle>
                {scanning ? (
                  <Button variant="destructive" size="sm" onClick={stopScanner}>
                    <Square className="w-4 h-4 mr-2" />
                    Arrêter
                  </Button>
                ) : (
                  <Button size="sm" onClick={startScanner}>
                    <Play className="w-4 h-4 mr-2" />
                    Démarrer
                  </Button>
                )}
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
                <div
                  id="qr-reader"
                  className={cn(
                    "w-full rounded-lg overflow-hidden bg-muted/40 border-2 border-dashed border-border",
                    !scanning && "min-h-[280px] flex items-center justify-center"
                  )}
                >
                  {!scanning && (
                    <div className="text-center text-muted-foreground p-8">
                      <Camera className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p className="text-sm">Cliquez sur « Démarrer » pour activer la caméra.</p>
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
