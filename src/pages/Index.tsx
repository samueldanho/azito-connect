import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChurchLogo } from "@/components/icons/ChurchLogo";
import { Users, BarChart3, Shield, Smartphone, ArrowRight, Check } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Users,
      title: "Gestion des Membres",
      description: "Centralisez toutes les informations de vos membres en un seul endroit",
    },
    {
      icon: BarChart3,
      title: "Statistiques Détaillées",
      description: "Suivez la présence et l'engagement avec des tableaux de bord intuitifs",
    },
    {
      icon: Shield,
      title: "Sécurité Renforcée",
      description: "Protection des données avec authentification et contrôle d'accès",
    },
    {
      icon: Smartphone,
      title: "Multi-Plateforme",
      description: "Accessible sur ordinateur, tablette et mobile",
    },
  ];

  const benefits = [
    "Gestion simplifiée des présences",
    "Suivi par service et département",
    "Historique complet des activités",
    "Export des données en PDF/Excel",
    "Interface intuitive et moderne",
    "Support multi-utilisateurs",
  ];

  return (
    <div className="min-h-screen gradient-hero">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ChurchLogo size="sm" />
            <div>
              <h1 className="font-display text-xl text-foreground">Mon Église</h1>
              <span className="text-primary font-semibold text-sm">Connect</span>
            </div>
          </div>
          <Button variant="golden" onClick={() => navigate("/auth")}>
            Se connecter
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 lg:py-24">
        <div className="max-w-4xl mx-auto text-center animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            Plateforme de gestion d'église
          </div>
          
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground mb-6 leading-tight">
            Gérez votre{" "}
            <span className="text-gradient">communauté</span>{" "}
            avec simplicité
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Une solution complète pour la gestion des membres, le suivi des présences 
            et l'analyse statistique de votre église.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="hero" size="xl" onClick={() => navigate("/auth")}>
              Commencer maintenant
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate("/inscription")}>
              S'inscrire comme membre
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
            Fonctionnalités Principales
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tout ce dont vous avez besoin pour gérer efficacement votre église
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="glass-card p-6 text-center group hover:shadow-elevated transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-primary group-hover:text-primary-foreground" />
              </div>
              <h3 className="font-display text-lg text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="glass-card p-8 md:p-12">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4">
                Pourquoi choisir{" "}
                <span className="text-gradient">Mon Église Connect</span> ?
              </h2>
              <p className="text-muted-foreground mb-8">
                Notre plateforme a été conçue spécifiquement pour les besoins 
                des églises africaines modernes, avec une interface intuitive 
                et des fonctionnalités adaptées.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-sm text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-success/20 flex items-center justify-center">
                <ChurchLogo size="lg" className="w-32 h-32 opacity-80" />
              </div>
              <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/20 rounded-2xl blur-2xl" />
              <div className="absolute -top-4 -left-4 w-20 h-20 bg-accent/20 rounded-2xl blur-2xl" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center gradient-primary rounded-2xl p-10 md:p-16 shadow-elevated">
          <h2 className="font-display text-3xl md:text-4xl text-primary-foreground mb-4">
            Prêt à transformer la gestion de votre église ?
          </h2>
          <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
            Rejoignez des centaines d'églises qui utilisent déjà Mon Église Connect
          </p>
          <Button
            variant="secondary"
            size="xl"
            onClick={() => navigate("/auth")}
            className="shadow-lg"
          >
            Démarrer gratuitement
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ChurchLogo size="sm" />
            <span className="text-sm text-muted-foreground">
              © 2024 Mon Église Connect. Tous droits réservés.
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Confidentialité
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Conditions
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
