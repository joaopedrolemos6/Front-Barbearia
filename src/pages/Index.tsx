// src/pages/Index.tsx

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Scissors, Clock, Star, Users, Calendar, MapPin, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useServices } from "@/hooks/useServices"; // ADICIONADO para buscar os serviços

const Index = () => {
  // ADICIONADO: Busca os serviços da API
  const { data: services = [], isLoading: isLoadingServices } = useServices();

  const features = [
    {
      icon: Calendar,
      title: "Agendamento Online",
      description: "Agende seu horário de forma rápida e prática"
    },
    {
      icon: Users,
      title: "Barbeiros Profissionais",
      description: "Equipe especializada e experiente"
    },
    {
      icon: Clock,
      title: "Horários Flexíveis", 
      description: "Funcionamos de segunda a sábado"
    },
    {
      icon: Star,
      title: "Qualidade Premium",
      description: "Produtos e equipamentos de primeira linha"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-accent/30">
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto animate-fade-in">
          <h1 className="text-6xl md:text-8xl font-light text-foreground mb-8 leading-tight tracking-tight">
            BarbershopPro
          </h1>
          <p className="text-2xl md:text-3xl text-muted-foreground mb-6 font-light">
            A excelência em cuidados masculinos
          </p>
          <p className="text-lg text-muted-foreground mb-16 max-w-3xl mx-auto leading-relaxed">
            Transforme sua experiência de barbearia com nosso sistema de agendamento inteligente. 
            Escolha seu barbeiro, selecione seus serviços e garante seu horário.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild variant="hero" size="lg" className="text-base px-12 py-6 h-14">
              <Link to="/booking">Agendar Agora</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="text-base px-12 py-6 h-14">
              <Link to="/barber">Área do Barbeiro</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-12 py-6 h-14">
              <Link to="/admin">Área do Proprietário</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 animate-slide-up">
            <h2 className="text-4xl md:text-5xl font-light mb-6 text-foreground">Nossos Serviços</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Oferecemos uma gama completa de serviços para o cuidado masculino
            </p>
          </div>

          {/* MODIFICADO: Lógica para exibir os serviços da API */}
          {isLoadingServices ? (
            <div className="flex justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {services.map((service, index) => (
                <Card 
                  key={service.id}
                  className="p-8 hover-lift bg-card border border-border"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="text-center">
                    <div className="w-14 h-14 mx-auto mb-6 bg-accent rounded-lg flex items-center justify-center">
                      <Scissors className="w-6 h-6 text-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-3">{service.name}</h3>
                    <div className="text-2xl font-light text-foreground mb-3">R$ {service.price.toFixed(2)}</div>
                    <p className="text-muted-foreground flex items-center justify-center gap-1 text-sm">
                      <Clock className="w-4 h-4" />
                      {service.duration_minutes}min
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-6 bg-accent/20">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-light mb-6 text-foreground">Por que escolher a BarbershopPro?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tecnologia e tradição combinadas para oferecer a melhor experiência
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">
            {features.map((feature, index) => (
              <div 
                key={feature.title}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.15}s` }}
              >
                <div className="w-16 h-16 mx-auto mb-6 bg-background rounded-lg flex items-center justify-center shadow-elegant">
                  <feature.icon className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="p-16 bg-card border border-border shadow-glass">
            <h2 className="text-3xl md:text-4xl font-light text-foreground mb-6">
              Pronto para uma nova experiência?
            </h2>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Faça seu agendamento agora e descubra o que é ter o melhor cuidado masculino
            </p>
            <Button asChild variant="hero" size="lg" className="text-base px-12 py-6 h-14">
              <Link to="/booking">Começar Agendamento</Link>
            </Button>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-accent/10 py-16 px-6 border-t border-border">
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-8">
            <Scissors className="w-6 h-6 text-foreground" />
            <span className="text-xl font-medium text-foreground">BarbershopPro</span>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>Rua das Flores, 123 - Centro</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Seg-Sáb: 8h às 20h</span>
            </div>
          </div>
          <p className="text-muted-foreground/60 mt-8 text-sm">© 2024 BarbershopPro. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;