import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Camera,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Chrome,
  Smartphone,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type PermState = "granted" | "denied" | "prompt" | "unsupported" | "checking";

interface EnvInfo {
  secure: boolean;
  inIframe: boolean;
  hasMediaDevices: boolean;
  browser: string;
  os: string;
}

function detectEnv(): EnvInfo {
  const ua = navigator.userAgent;
  let browser = "Navigateur";
  if (/Edg\//.test(ua)) browser = "Edge";
  else if (/Chrome\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) browser = "Safari";
  let os = "Bureau";
  if (/Android/.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/Mac/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";
  return {
    secure: window.isSecureContext,
    inIframe: window.self !== window.top,
    hasMediaDevices: !!navigator.mediaDevices?.getUserMedia,
    browser,
    os,
  };
}

export default function AideCamera() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [perm, setPerm] = useState<PermState>("checking");
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [env, setEnv] = useState<EnvInfo | null>(null);
  const [testing, setTesting] = useState(false);

  const check = async () => {
    setEnv(detectEnv());
    if (!navigator.mediaDevices?.getUserMedia) {
      setPerm("unsupported");
      return;
    }
    try {
      // @ts-ignore - "camera" is not in all TS lib versions
      const status = await navigator.permissions?.query({ name: "camera" as PermissionName });
      if (status) {
        setPerm(status.state as PermState);
        status.onchange = () => setPerm(status.state as PermState);
      } else {
        setPerm("prompt");
      }
    } catch {
      setPerm("prompt");
    }
    try {
      const devs = await navigator.mediaDevices.enumerateDevices();
      setCameras(devs.filter((d) => d.kind === "videoinput"));
    } catch {}
  };

  useEffect(() => {
    check();
  }, []);

  const testCamera = async () => {
    setTesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      stream.getTracks().forEach((t) => t.stop());
      setPerm("granted");
      const devs = await navigator.mediaDevices.enumerateDevices();
      setCameras(devs.filter((d) => d.kind === "videoinput"));
    } catch (e: any) {
      if (/NotAllowed|denied|Permission/i.test(e?.name || e?.message || "")) {
        setPerm("denied");
      } else if (/NotFound|Devices/i.test(e?.name || e?.message || "")) {
        setPerm("unsupported");
      } else {
        setPerm("prompt");
      }
    } finally {
      setTesting(false);
    }
  };

  const openInNewTab = () => {
    window.open(window.location.origin + "/dashboard/scan-presence", "_blank", "noopener,noreferrer");
  };

  const statusBadge = () => {
    switch (perm) {
      case "granted":
        return (
          <Badge className="bg-success/15 text-success border-success/30 hover:bg-success/20">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Autorisée
          </Badge>
        );
      case "denied":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3.5 h-3.5 mr-1" /> Bloquée
          </Badge>
        );
      case "prompt":
        return (
          <Badge variant="secondary">
            <HelpCircle className="w-3.5 h-3.5 mr-1" /> À demander
          </Badge>
        );
      case "unsupported":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Indisponible
          </Badge>
        );
      default:
        return <Badge variant="outline">Vérification…</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        isCollapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className={cn("transition-all duration-300", sidebarCollapsed ? "ml-20" : "ml-64")}>
        <DashboardHeader onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <main className="p-6 space-y-6 max-w-5xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-semibold">Aide — Autoriser la caméra</h1>
              <p className="text-sm text-muted-foreground">
                Diagnostic et instructions pour activer le scan QR de présence.
              </p>
            </div>
          </div>

          {/* Diagnostic */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" /> État de la caméra
              </CardTitle>
              {statusBadge()}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                <div className="flex justify-between p-2 rounded-md bg-muted/40">
                  <span className="text-muted-foreground">Contexte sécurisé (HTTPS)</span>
                  <span className={env?.secure ? "text-success font-medium" : "text-destructive font-medium"}>
                    {env?.secure ? "Oui" : "Non"}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-muted/40">
                  <span className="text-muted-foreground">Page dans un iframe</span>
                  <span className={env?.inIframe ? "text-amber-600 font-medium" : "text-success font-medium"}>
                    {env?.inIframe ? "Oui (peut bloquer)" : "Non"}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-muted/40">
                  <span className="text-muted-foreground">API caméra disponible</span>
                  <span className={env?.hasMediaDevices ? "text-success font-medium" : "text-destructive font-medium"}>
                    {env?.hasMediaDevices ? "Oui" : "Non"}
                  </span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-muted/40">
                  <span className="text-muted-foreground">Caméras détectées</span>
                  <span className="font-medium">{cameras.length}</span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-muted/40">
                  <span className="text-muted-foreground">Navigateur</span>
                  <span className="font-medium">{env?.browser}</span>
                </div>
                <div className="flex justify-between p-2 rounded-md bg-muted/40">
                  <span className="text-muted-foreground">Système</span>
                  <span className="font-medium">{env?.os}</span>
                </div>
              </div>

              {perm === "denied" && (
                <Alert variant="destructive">
                  <XCircle className="w-4 h-4" />
                  <AlertTitle>Caméra bloquée</AlertTitle>
                  <AlertDescription>
                    Votre navigateur a refusé l'accès à la caméra. Suivez les étapes ci-dessous pour la réautoriser,
                    puis cliquez sur « Retester ».
                  </AlertDescription>
                </Alert>
              )}
              {perm === "prompt" && (
                <Alert>
                  <HelpCircle className="w-4 h-4" />
                  <AlertTitle>Autorisation non demandée</AlertTitle>
                  <AlertDescription>
                    Cliquez sur « Tester la caméra » ci-dessous — votre navigateur affichera une fenêtre de permission.
                  </AlertDescription>
                </Alert>
              )}
              {env?.inIframe && perm !== "granted" && (
                <Alert>
                  <AlertTriangle className="w-4 h-4" />
                  <AlertTitle>Aperçu Lovable détecté</AlertTitle>
                  <AlertDescription>
                    L'aperçu intégré bloque souvent la caméra. Ouvrez l'application dans un nouvel onglet pour l'utiliser.
                  </AlertDescription>
                </Alert>
              )}
              {perm === "granted" && (
                <Alert className="border-success/30 bg-success/5">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <AlertTitle>Tout est prêt</AlertTitle>
                  <AlertDescription>
                    Vous pouvez utiliser le scan QR de présence.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap gap-2">
                <Button onClick={testCamera} disabled={testing}>
                  <Camera className="w-4 h-4 mr-2" />
                  {testing ? "Test en cours…" : "Tester la caméra"}
                </Button>
                <Button variant="outline" onClick={check}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retester
                </Button>
                <Button variant="outline" onClick={openInNewTab}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Ouvrir dans un onglet
                </Button>
                <Button variant="secondary" asChild>
                  <Link to="/dashboard/scan-presence">Aller au scan QR</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Chrome className="w-5 h-5" /> Sur ordinateur
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p className="font-medium">Chrome / Edge</p>
                <ol className="list-decimal ml-5 space-y-1 text-muted-foreground">
                  <li>Cliquez sur l'icône 🔒 ou ⓘ à gauche de l'URL.</li>
                  <li>Ouvrez « Autorisations du site ».</li>
                  <li>Passez « Caméra » sur <b>Autoriser</b>.</li>
                  <li>Rechargez la page (F5).</li>
                </ol>
                <p className="font-medium mt-4">Firefox</p>
                <ol className="list-decimal ml-5 space-y-1 text-muted-foreground">
                  <li>Cliquez sur l'icône de cadenas dans la barre d'adresse.</li>
                  <li>Retirez le blocage « Utiliser la caméra ».</li>
                  <li>Rechargez la page.</li>
                </ol>
                <p className="font-medium mt-4">Safari (macOS)</p>
                <ol className="list-decimal ml-5 space-y-1 text-muted-foreground">
                  <li>Menu Safari → Réglages → Sites web → Caméra.</li>
                  <li>Sélectionnez ce site et choisissez <b>Autoriser</b>.</li>
                </ol>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" /> Sur mobile
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-3">
                <p className="font-medium">Android (Chrome)</p>
                <ol className="list-decimal ml-5 space-y-1 text-muted-foreground">
                  <li>Appuyez sur ⋮ → <b>Paramètres du site</b>.</li>
                  <li>Ouvrez <b>Caméra</b> et autorisez ce site.</li>
                  <li>Vérifiez que Chrome a l'accès caméra dans les Réglages Android.</li>
                </ol>
                <p className="font-medium mt-4">iOS (Safari)</p>
                <ol className="list-decimal ml-5 space-y-1 text-muted-foreground">
                  <li>Réglages iOS → Safari → <b>Caméra</b> → Autoriser.</li>
                  <li>Réglages iOS → Confidentialité → Caméra → activez Safari.</li>
                  <li>Rechargez l'onglet Safari (icône ⟳).</li>
                </ol>
                <p className="font-medium mt-4">Astuce</p>
                <p className="text-muted-foreground">
                  Si rien n'apparaît, essayez « Ouvrir dans un onglet » ci-dessus pour sortir de l'aperçu intégré.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Alternatives sans caméra</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>Sur la page <b>Scan QR</b>, vous pouvez toujours :</p>
              <ul className="list-disc ml-5 space-y-1">
                <li>Importer une photo ou capture d'écran du badge (bouton « Choisir une image »).</li>
                <li>Coller manuellement le token du badge (commence par <code>BADGE.v1…</code>).</li>
              </ul>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
