// src/pages/BarberDashboard.tsx

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// ADICIONADO: Imports para as Abas
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, User, Phone, Scissors, DollarSign, TrendingUp, Users, Loader2, LogIn, LogOut } from "lucide-react";
import { Link } from "react-router-dom";
import { useBarberAppointments } from "@/hooks/useAppointments";
import { format, isToday, isThisWeek, isThisMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";
import { Appointment } from "@/types/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// ADICIONADO: Import do componente de Calendário
import CalendarView from "@/components/CalendarView";

const BarberDashboard = () => {
  const { user, login, logout, isLoading: isAuthLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const isBarber = user?.role === 'BARBER';

  const { data: appointments = [], isLoading, refetch } = useBarberAppointments(isBarber);

  useEffect(() => {
    if (isBarber) {
      refetch();
    }
  }, [isBarber, refetch]);

  const handleBarberLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await login(email, password);
  };

  const calculateRevenue = (filterFn: (date: Date) => boolean) => {
    return appointments
      .filter(a => a.status === 'APPROVED' && filterFn(new Date(a.datetime)))
      .reduce((sum, a) => sum + (a.service_price || 0), 0);
  };

  const stats = {
    todayRevenue: calculateRevenue(isToday),
    weekRevenue: calculateRevenue((date) => isThisWeek(date, { weekStartsOn: 1 })),
    monthRevenue: calculateRevenue(isThisMonth),
    todayAppointments: appointments.filter(a => isToday(new Date(a.datetime))).length,
  };
  
  const getStatusColor = (status: string) => {
      switch (status) {
      case "APPROVED": return "bg-green-100 text-green-800";
      case "PENDING": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  const getStatusText = (status: string) => {
    const statusMap = { APPROVED: "Aprovado", PENDING: "Pendente" };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  if (isAuthLoading) {
    return (<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>);
  }

  if (!isBarber) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4">Área do Barbeiro</h2>
          <p className="text-muted-foreground mb-6">
            {user ? 'Você não tem permissão para acessar esta página.' : 'Faça login com suas credenciais de barbeiro.'}
          </p>
          {user && user.role !== 'BARBER' ? (
            <Button onClick={logout} variant="destructive"><LogOut className="w-4 h-4 mr-2" />Sair (Logado como {user?.name})</Button>
          ) : (
            <form className="space-y-4 text-left">
              <div className="space-y-2">
                <Label htmlFor="email-barber">Email</Label>
                <Input id="email-barber" type="email" placeholder="joao@barbershop.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-barber">Senha</Label>
                <Input id="password-barber" type="password" placeholder="Sua senha" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button onClick={handleBarberLogin} disabled={isAuthLoading} className="w-full">
                {isAuthLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogIn className="w-4 h-4 mr-2" />}
                Entrar
              </Button>
            </form>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-secondary transition-colors mb-4 sm:mb-6"><Scissors className="w-5 h-5" /><span className="text-lg font-medium">BarbershopPro</span></Link>
            <h1 className="text-3xl sm:text-4xl font-light text-foreground">Dashboard do Barbeiro</h1>
            <p className="text-muted-foreground mt-2">Bem-vindo, {user?.name}! Aqui estão seus agendamentos.</p>
          </div>
          <Button onClick={() => refetch()} variant="outline"><Loader2 className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> Atualizar</Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Card className="p-4 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Agendamentos Hoje</p><p className="text-2xl font-light text-primary">{stats.todayAppointments}</p></div><Calendar className="w-6 h-6 text-secondary" /></div></Card>
          <Card className="p-4 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Faturamento Hoje</p><p className="text-2xl font-light text-secondary">R$ {stats.todayRevenue.toFixed(2)}</p></div><DollarSign className="w-6 h-6 text-secondary" /></div></Card>
          <Card className="p-4 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Faturamento Semanal</p><p className="text-2xl font-light text-green-600">R$ {stats.weekRevenue.toFixed(2)}</p></div><TrendingUp className="w-6 h-6 text-green-600" /></div></Card>
          <Card className="p-4 sm:p-6"><div className="flex items-center justify-between"><div><p className="text-sm text-muted-foreground">Faturamento Mensal</p><p className="text-2xl font-light text-primary">R$ {stats.monthRevenue.toFixed(2)}</p></div><Users className="w-6 h-6 text-secondary" /></div></Card>
        </div>
        
        {/* ADICIONADO: Sistema de Abas */}
        <Tabs defaultValue="list" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Lista de Agendamentos</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            <Card className="p-8">
              <h2 className="text-xl font-medium mb-8">Seus Próximos Agendamentos</h2>
              {isLoading ? (<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div>) : (<div className="space-y-6">{appointments.map((appointment) => (<Card key={appointment.id} className="p-6 bg-background"><div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center"><div className="md:col-span-2 flex items-center gap-4"><User className="w-8 h-8 text-secondary" /><div><h3 className="font-medium">{appointment.client_name}</h3><p className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{appointment.client_phone}</p></div></div><div><p className="font-medium flex items-center gap-1"><Scissors className="w-4 h-4 text-secondary" />{appointment.service_name}</p></div><div><p className="font-medium">{format(new Date(appointment.datetime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p></div><div className="text-right"><Badge className={getStatusColor(appointment.status)}>{getStatusText(appointment.status)}</Badge></div></div></Card>))}</div>)}
            </Card>
          </TabsContent>
          
          <TabsContent value="calendar">
            <CalendarView appointments={appointments} isLoading={isLoading} />
          </TabsContent>
        </Tabs>

      </div>
    </div>
  );
};

export default BarberDashboard;