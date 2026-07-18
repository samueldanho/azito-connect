import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Member } from "@/hooks/useMembers";
import { useRef } from "react";

interface MemberQRDialogProps {
  member: Member | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MemberQRDialog = ({ member, open, onOpenChange }: MemberQRDialogProps) => {
  const wrapperRef = useRef<HTMLDivElement>(null);

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
    w.document.write(`
      <html><head><title>Badge - ${member.nom_complet}</title>
      <style>
        body{font-family:system-ui;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px;gap:16px}
        h2{margin:0;font-size:24px}
        p{margin:0;color:#666}
        img{width:280px;height:280px}
      </style></head><body>
        <h2>${member.nom_complet}</h2>
        <img src="${url}" />
        <p>Scannez ce code pour marquer la présence</p>
        <script>window.onload=()=>{window.print();}</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Badge QR — {member.nom_complet}</DialogTitle>
          <DialogDescription>
            À scanner à l'entrée pour enregistrer la présence.
          </DialogDescription>
        </DialogHeader>
        <div ref={wrapperRef} className="flex justify-center py-4 bg-white rounded-lg">
          <QRCodeCanvas
            value={member.id}
            size={240}
            level="H"
            includeMargin
          />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownload} variant="outline" className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Télécharger
          </Button>
          <Button onClick={handlePrint} className="flex-1">
            <Printer className="w-4 h-4 mr-2" />
            Imprimer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
