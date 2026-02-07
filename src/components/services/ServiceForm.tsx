import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Tables } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const schema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  description: z.string().optional(),
  couleur: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Couleur invalide"),
});

type FormValues = z.infer<typeof schema>;

const PRESET_COLORS = [
  "#D97706", "#DC2626", "#2563EB", "#059669",
  "#7C3AED", "#DB2777", "#0891B2", "#65A30D",
];

interface ServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Tables<"services"> | null;
  onSubmit: (data: FormValues) => void;
  isLoading: boolean;
}

export const ServiceForm = ({ open, onOpenChange, service, onSubmit, isLoading }: ServiceFormProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nom: "", description: "", couleur: "#D97706" },
  });

  useEffect(() => {
    if (open) {
      form.reset(
        service
          ? { nom: service.nom, description: service.description || "", couleur: service.couleur || "#D97706" }
          : { nom: "", description: "", couleur: "#D97706" }
      );
    }
  }, [open, service, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{service ? "Modifier le service" : "Nouveau service"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom du service</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Louange, Accueil..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Description du service..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="couleur"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Couleur</FormLabel>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => field.onChange(color)}
                        className="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor: field.value === color ? "hsl(var(--foreground))" : "transparent",
                        }}
                      />
                    ))}
                    <Input
                      type="color"
                      value={field.value}
                      onChange={(e) => field.onChange(e.target.value)}
                      className="w-10 h-8 p-0 border-0 cursor-pointer"
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : service ? "Modifier" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
