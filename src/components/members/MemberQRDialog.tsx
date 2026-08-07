import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Download, Printer, Loader2, ShieldCheck } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Member } from "@/hooks/useMembers";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MemberQRDialogProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TTL_OPTIONS = [
  { label: "1 jour", value: 60 * 60 * 24 },
  { label: "7 jours", value: 60 * 60 * 24 * 7 },
  { label: "30 jours", value: 60 * 60 * 24 * 30 },
  { label: "90 jours", value: 60 * 60 * 24 * 90 },
  { label: "1 an", value: 60 * 60 * 24 * 365 },
];

export const MemberQRDialog = ({ member, open, onOpenChange }: MemberQRDialogProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [ttl, setTtl] = useState<number>(60 * 60 * 24 * 30);
  const [token, setToken] = useState<string | null>(null);
  const [exp, setExp] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchToken = async () => {
    if (!member) return;
    setLoading(true);
    setToken(null);
    try {
      const { data, error } = await supabase.functions.invoke("issue-badge-token", {
        body: { member_id: member.id, ttl_seconds: ttl },
      });
      if (error) throw error;
      if (!data?.token) throw new Error("Token manquant");
      setToken(data.token);
      setExp(data.exp);
    } catch (e) {
      toast({
        title: "Impossible de générer le badge",
        description: (e instanceof Error ? e.message : null) ?? "Erreur inconnue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && member) fetchToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, member?.id, ttl]);

  if (!member) return null;

  const handleDownload = () => {
    const canvas = wrapperRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `qr-${member.nom_complet.replace(/\s+/g, "-")}.png`;
    a.click();
  };

  const handlePrint = () => {
    const canvas = wrapperRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const w = window.open("", "_blank");
    if (!w) return;
    const expStr = exp ? new Date(exp * 1000).toLocaleDateString() : "";
    w.document.write(`
      <html><head><title>Badge - ${member.nom_complet}</title>
      <style>
        body{font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;gap:12px}
        h2{margin:0;font-size:24px}
        p{margin:0;color:#666;font-size:12px}
        img{width:280px;height:280px}
      </style></head><body>
        <h2>${member.nom_complet}</h2>
        <img src="${url}" />
        <p>Scannez ce code pour marquer la présence</p>
        <p>Valide jusqu'au ${expStr}</p>
        <script>window.onload=()=>{window.print();}</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Badge QR — {member.nom_complet}</DialogTitle>
          <DialogDescription className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Badge signé avec expiration.
          </DialogDescription>
        </DialogHeader>

        <div>
          <Label>Validité</Label>
          <Select value={String(ttl)} onValueChange={(v) => setTtl(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {TTL_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div ref={wrapperRef} className="flex flex-col items-center justify-center py-4 bg-white rounded-lg min-h-[260px]">
          {loading || !token ? (
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          ) : (
            <>
              <QRCodeCanvas value={token} size={240} level="M" includeMargin />
              {exp && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  Valide jusqu'au {new Date(exp * 1000).toLocaleString()}
                </p>
              )}
            </>
          )}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleDownload} variant="outline" className="flex-1" disabled={!token}>
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </Button>
          <Button onClick={handlePrint} className="flex-1" disabled={!token}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
