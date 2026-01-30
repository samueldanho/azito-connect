import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Member, MemberInsert, useServices } from "@/hooks/useMembers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const memberSchema = z.object({
  nom_complet: z
    .string()
    .trim()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(100, "Le nom ne peut pas dépasser 100 caractères"),
  telephone: z
    .string()
    .trim()
    .max(20, "Le numéro ne peut pas dépasser 20 caractères")
    .optional()
    .or(z.literal("")),
  lieu_habitation: z
    .string()
    .trim()
    .max(200, "L'adresse ne peut pas dépasser 200 caractères")
    .optional()
    .or(z.literal("")),
  service_id: z.string().uuid().optional().or(z.literal("")),
  statut_bapteme: z.enum(["baptise", "non_baptise"]),
  est_actif: z.boolean(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member | null;
  onSubmit: (data: MemberInsert) => void;
  isLoading?: boolean;
}

export const MemberForm = ({
  open,
  onOpenChange,
  member,
  onSubmit,
  isLoading,
}: MemberFormProps) => {
  const { data: services = [] } = useServices();
  const { toast } = useToast();
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const isEditing = !!member;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      nom_complet: "",
      telephone: "",
      lieu_habitation: "",
      service_id: "",
      statut_bapteme: "non_baptise",
      est_actif: true,
    },
  });

  const watchedName = watch("nom_complet");
  const initials = watchedName
    ? watchedName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  useEffect(() => {
    if (member) {
      reset({
        nom_complet: member.nom_complet,
        telephone: member.telephone || "",
        lieu_habitation: member.lieu_habitation || "",
        service_id: member.service_id || "",
        statut_bapteme: member.statut_bapteme,
        est_actif: member.est_actif,
      });
      setPhotoUrl(member.photo_url);
    } else {
      reset({
        nom_complet: "",
        telephone: "",
        lieu_habitation: "",
        service_id: "",
        statut_bapteme: "non_baptise",
        est_actif: true,
      });
      setPhotoUrl(null);
    }
  }, [member, reset]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner une image valide.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erreur",
        description: "L'image ne doit pas dépasser 5 Mo.",
        variant: "destructive",
      });
      return;
    }

    setUploadingPhoto(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("membres-photos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("membres-photos")
        .getPublicUrl(filePath);

      setPhotoUrl(urlData.publicUrl);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger la photo.",
        variant: "destructive",
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onFormSubmit = (data: MemberFormData) => {
    onSubmit({
      nom_complet: data.nom_complet,
      telephone: data.telephone || null,
      lieu_habitation: data.lieu_habitation || null,
      service_id: data.service_id || null,
      statut_bapteme: data.statut_bapteme,
      est_actif: data.est_actif,
      photo_url: photoUrl,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? "Modifier le membre" : "Nouveau membre"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Modifiez les informations du membre ci-dessous."
              : "Ajoutez un nouveau membre à votre église."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          {/* Photo Upload */}
          <div className="flex justify-center">
            <label className="relative cursor-pointer group">
              <Avatar className="h-20 w-20 border-2 border-primary/20 group-hover:border-primary/50 transition-colors">
                <AvatarImage src={photoUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-md">
                {uploadingPhoto ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhoto}
              />
            </label>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="nom_complet">Nom complet *</Label>
            <Input
              id="nom_complet"
              {...register("nom_complet")}
              placeholder="Ex: Jean Kouassi"
            />
            {errors.nom_complet && (
              <p className="text-sm text-destructive">{errors.nom_complet.message}</p>
            )}
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              {...register("telephone")}
              placeholder="Ex: +225 07 00 00 00"
            />
            {errors.telephone && (
              <p className="text-sm text-destructive">{errors.telephone.message}</p>
            )}
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="lieu_habitation">Lieu d'habitation</Label>
            <Input
              id="lieu_habitation"
              {...register("lieu_habitation")}
              placeholder="Ex: Cocody, Abidjan"
            />
            {errors.lieu_habitation && (
              <p className="text-sm text-destructive">{errors.lieu_habitation.message}</p>
            )}
          </div>

          {/* Service */}
          <div className="space-y-2">
            <Label>Service</Label>
            <Select
              value={watch("service_id") || ""}
              onValueChange={(value) => setValue("service_id", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: service.couleur || "#D97706" }}
                      />
                      {service.nom}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Baptism Status */}
          <div className="space-y-2">
            <Label>Statut de baptême</Label>
            <Select
              value={watch("statut_bapteme")}
              onValueChange={(value: "baptise" | "non_baptise") =>
                setValue("statut_bapteme", value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baptise">Baptisé</SelectItem>
                <SelectItem value="non_baptise">Non baptisé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between">
            <Label htmlFor="est_actif">Membre actif</Label>
            <Switch
              id="est_actif"
              checked={watch("est_actif")}
              onCheckedChange={(checked) => setValue("est_actif", checked)}
            />
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? "Enregistrer" : "Ajouter"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
