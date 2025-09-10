// src/pages/Admin.tsx

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import {
  Calendar,
  User,
  Scissors,
  DollarSign,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Edit,
  Loader2,
  LogIn,
  LogOut,
  PlusCircle,
  Trash2
} from "lucide-react";

import { Link } from "react-router-dom";
import { useAppointments, useUpdateAppointmentStatus } from "@/hooks/useAppointments";
import { useBarbers, useCreateBarber, useDeleteBarber, useUpdateBarber } from "@/hooks/useBarbers";
import { useServices, useCreateService, useDeleteService, useUpdateService } from "@/hooks/useServices";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/context/AuthContext";
import { Appointment, Barber, Service } from "@/types/api";

import CalendarView from "@/components/CalendarView";

// ---- Schemas ----
const barberFormSchema = z.object({
  name: z.string().min(2, "O nome é obrigatório."),
  email: z.string().email("Por favor, insira um email válido.").optional(),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres.").optional().or(z.literal("")),
  phone: z.string().optional(),
  specialties: z.string().optional(),
  bio: z.string().optional(),
  avatar_file: z.any().optional(),
});

const serviceFormSchema = z.object({
  name: z.string().min(2, "O nome do serviço é obrigatório."),
  price: z.preprocess((val) => Number(val), z.number().positive("O preço deve ser positivo.")),
  duration_minutes: z.preprocess((val) => Number(val), z.number().int().positive("A duração deve ser positiva.")),
  description: z.string().optional(),
});

const Admin = () => {
  const { user, login, logout, isLoading: isAuthLoading } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  // ---- Data hooks ----
  const { data: appointments = [], isLoading: isLoadingAppointments, refetch: refetchAppointments } = useAppointments();
  const { data: barbers = [], isLoading: isLoadingBarbers, refetch: refetchBarbers } = useBarbers();
  const { data: services = [], isLoading: isLoadingServices, refetch: refetchServices } = useServices();

  const updateStatus = useUpdateAppointmentStatus();
  const createBarber = useCreateBarber();
  const updateBarber = useUpdateBarber();
  const deleteBarber = useDeleteBarber();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();

  // ---- State ----
  const [isBarberDialogOpen, setBarberDialogOpen] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [isServiceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ---- Forms ----
  const barberForm = useForm<z.infer<typeof barberFormSchema>>({
    resolver: zodResolver(barberFormSchema),
    defaultValues: { name: "", email: "", password: "", phone: "", specialties: "", bio: "", avatar_file: undefined },
  });
  
  const avatarFileRef = barberForm.register("avatar_file");

  const serviceForm = useForm<z.infer<typeof serviceFormSchema>>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: { name: "", price: 0, duration_minutes: 30, description: "" },
  });

  // ---- Auth ----
  const handleAdminLogin = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await login(email, password);
  };

  // ---- Barber CRUD ----
  const handleAddBarberClick = () => {
    setEditingBarber(null);
    barberForm.reset();
    setBarberDialogOpen(true);
  };

  const handleEditBarberClick = (barber: Barber) => {
    setEditingBarber(barber);
    barberForm.reset({
      name: barber.name,
      email: barber.email,
      phone: barber.phone || "",
      specialties: barber.profile?.specialties?.join(", ") || "",
      bio: barber.profile?.bio || "",
      avatar_file: undefined,
    });
    setBarberDialogOpen(true);
  };
  
  // MODIFICADO: Lógica de submissão do formulário de barbeiro
  const onBarberSubmit = async (values: z.infer<typeof barberFormSchema>) => {
    const formData = new FormData();

    // Adiciona todos os campos, exceto 'specialties' e 'avatar_file'
    Object.entries(values).forEach(([key, value]) => {
      if (key !== "avatar_file" && key !== "specialties" && value) {
        formData.append(key, value as string);
      }
    });

    // Processa e adiciona as especialidades como um array
    if (values.specialties) {
      const specialtiesArray = values.specialties.split(",").map(s => s.trim()).filter(Boolean);
      specialtiesArray.forEach(specialty => {
        // A convenção para enviar arrays em FormData é usar a mesma chave
        formData.append("specialties", specialty);
      });
    }

    // Adiciona o arquivo de avatar se ele existir
    if (values.avatar_file && (values.avatar_file as FileList)[0]) {
      formData.append("avatar_file", (values.avatar_file as FileList)[0]);
    }

    if (editingBarber) {
      await updateBarber.mutateAsync({ id: editingBarber.id, data: formData });
    } else {
      await createBarber.mutateAsync(formData);
    }
    
    setBarberDialogOpen(false);
  };

  // ---- Service CRUD ----
  const handleAddServiceClick = () => {
    setEditingService(null);
    serviceForm.reset();
    setServiceDialogOpen(true);
  };

  const handleEditServiceClick = (service: Service) => {
    setEditingService(service);
    serviceForm.reset({
      name: service.name,
      price: service.price,
      duration_minutes: service.duration_minutes,
      description: service.description || "",
    });
    setServiceDialogOpen(true);
  };

  const onServiceSubmit = async (values: z.infer<typeof serviceFormSchema>) => {
    if (editingService) await updateService.mutateAsync({ id: editingService.id, data: values });
    else await createService.mutateAsync(values);

    serviceForm.reset();
    setEditingService(null);
    setServiceDialogOpen(false);
  };

  // ---- Effects ----
  useEffect(() => {
    if (isAdmin) {
      refetchAppointments();
      refetchBarbers();
      refetchServices();
    }
  }, [isAdmin, refetchAppointments, refetchBarbers, refetchServices]);

  // ---- Helpers ----
  const getStatusColor = (status: string) => ({
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELED: "bg-gray-100 text-gray-800",
    CANCELLED: "bg-gray-100 text-gray-800",
  }[status] || "bg-muted text-foreground");

  const getStatusText = (status: string) => ({
    PENDING: "Pendente",
    APPROVED: "Aprovado",
    REJECTED: "Rejeitado",
    CANCELED: "Cancelado",
    CANCELLED: "Cancelado",
  }[status] || status);

  const handleStatusChange = async (id: number, newStatus: string) => {
    await updateStatus.mutateAsync({ id, status: newStatus });
  };

  // ---- Loading/Auth gate ----
  if (isAuthLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-8 text-center w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4">Acesso Restrito</h2>
          <p className="text-muted-foreground mb-6">{user ? "Você não tem permissão." : "Faça login como administrador."}</p>
          {user ? (
            <Button onClick={logout} variant="destructive"><LogOut className="w-4 h-4 mr-2" />Sair (Logado como {user?.name})</Button>
          ) : (
            <form className="space-y-4">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Label>Senha</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button onClick={handleAdminLogin}><LogIn className="w-4 h-4 mr-2" />Entrar</Button>
            </form>
          )}
        </Card>
      </div>
    );
  }

  // ---- Stats ----
  const stats = {
    todayAppointments: appointments.filter(a => a.appointment_date === format(new Date(), "yyyy-MM-dd")).length,
    todayRevenue: appointments.filter(a => a.appointment_date === format(new Date(), "yyyy-MM-dd") && a.status === "APPROVED").reduce((sum, a) => sum + (a.service_price || 0), 0),
    weekRevenue: appointments.filter(a => a.status === "APPROVED").reduce((sum, a) => sum + (a.service_price || 0), 0),
    totalCustomers: new Set(appointments.map(a => a.client_id)).size,
  };

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-secondary transition-colors mb-4 sm:mb-6">
              <Scissors className="w-5 h-5" /> <span className="text-lg font-medium">BarbershopPro</span>
            </Link>
            <h1 className="text-3xl sm:text-4xl font-light text-foreground">Dashboard Administrativo</h1>
            <p className="text-muted-foreground mt-2">Olá, {user?.name}! Gerencie seu negócio.</p>
          </div>
          <Button onClick={() => { refetchAppointments(); refetchBarbers(); refetchServices(); }} variant="outline">
            <Loader2 className={`w-4 h-4 mr-2 ${isLoadingAppointments || isLoadingBarbers || isLoadingServices ? "animate-spin" : ""}`} /> Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          <Card className="p-4 sm:p-6"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Agendamentos Hoje</p><Calendar className="w-5 h-5 text-secondary" /></div><p className="text-xl font-light">{stats.todayAppointments}</p></Card>
          <Card className="p-4 sm:p-6"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Faturamento Hoje</p><DollarSign className="w-5 h-5 text-secondary" /></div><p className="text-xl font-light">R$ {stats.todayRevenue.toFixed(2)}</p></Card>
          <Card className="p-4 sm:p-6"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Faturamento Semanal</p><TrendingUp className="w-5 h-5 text-secondary" /></div><p className="text-xl font-light">R$ {stats.weekRevenue.toFixed(2)}</p></Card>
          <Card className="p-4 sm:p-6"><div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Total de Clientes</p><Users className="w-5 h-5 text-secondary" /></div><p className="text-xl font-light">{stats.totalCustomers}</p></Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="appointments">Agendamentos</TabsTrigger>
            <TabsTrigger value="calendar">Calendário</TabsTrigger>
            <TabsTrigger value="barbers">Barbeiros</TabsTrigger>
            <TabsTrigger value="services">Serviços</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          {/* Tab Contents */}
          <TabsContent value="appointments">
            {isLoadingAppointments ? <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div> :
              appointments.length === 0 ? <p className="text-muted-foreground text-center py-8">Nenhum agendamento encontrado.</p> :
                <div className="space-y-4">
                  {appointments.map(a => (
                    <Card key={a.id} className="p-4 flex flex-wrap justify-between items-center gap-4">
                      <div>
                        <p className="font-medium">{a.client_name}</p>
                        <p className="text-sm text-muted-foreground">{format(new Date(a.datetime), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} - {a.service_name}</p>
                      </div>
                      <Badge className={getStatusColor(a.status)}>{getStatusText(a.status)}</Badge>
                      <div className="flex gap-2">
                        {a.status === "PENDING" && (
                          <>
                            <Button size="sm" onClick={() => handleStatusChange(a.id, "APPROVED")}><CheckCircle className="w-4 h-4 mr-2"/>Aprovar</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleStatusChange(a.id, "REJECTED")}><XCircle className="w-4 h-4 mr-2"/>Rejeitar</Button>
                          </>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
            }
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView appointments={appointments} isLoading={isLoadingAppointments} />
          </TabsContent>

          <TabsContent value="barbers">
            <div className="flex justify-end mb-4">
              <Button onClick={handleAddBarberClick}><PlusCircle className="w-4 h-4 mr-2" />Adicionar Barbeiro</Button>
            </div>
            <div className="space-y-4">
              {isLoadingBarbers ? <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div> :
                barbers.map(b => (
                  <Card key={b.id} className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <Avatar>
                        <AvatarImage src={b.profile?.avatar_url} />
                        <AvatarFallback>{b.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{b.name}</p>
                        <p className="text-sm text-muted-foreground">{b.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditBarberClick(b)}><Edit className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deseja realmente excluir?</AlertDialogTitle>
                            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteBarber.mutateAsync(b.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))
              }
            </div>
          </TabsContent>

          <TabsContent value="services">
            <div className="flex justify-end mb-4">
              <Button onClick={handleAddServiceClick}><PlusCircle className="w-4 h-4 mr-2" />Adicionar Serviço</Button>
            </div>
            <div className="space-y-4">
              {isLoadingServices ? <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin" /></div> :
                services.map(s => (
                  <Card key={s.id} className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-sm text-muted-foreground">R$ {s.price.toFixed(2)} - {s.duration_minutes} min</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleEditServiceClick(s)}><Edit className="w-4 h-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Deseja realmente excluir?</AlertDialogTitle>
                            <AlertDialogDescription>Essa ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteService.mutateAsync(s.id)}>Excluir</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))
              }
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="p-4 text-center">
              <p className="text-muted-foreground">Configurações futuras...</p>
              <Button variant="destructive" className="mt-4" onClick={logout}><LogOut className="w-4 h-4 mr-2" />Sair</Button>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog open={isBarberDialogOpen} onOpenChange={setBarberDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingBarber ? "Editar Barbeiro" : "Adicionar Barbeiro"}</DialogTitle>
            </DialogHeader>
            <Form {...barberForm}>
              <form onSubmit={barberForm.handleSubmit(onBarberSubmit)} className="space-y-4">
                <FormField name="name" control={barberForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="email" control={barberForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="password" control={barberForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha {editingBarber && "(Deixe em branco para não alterar)"}</FormLabel>
                    <FormControl><Input {...field} type="password" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="phone" control={barberForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="specialties" control={barberForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Especialidades (separadas por vírgula)</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormField name="bio" control={barberForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                  </FormItem>
                )} />
                <FormItem>
                  <FormLabel>Foto do Perfil</FormLabel>
                  <FormControl>
                    <Input type="file" {...avatarFileRef} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setBarberDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createBarber.isPending || updateBarber.isPending}>
                    {(createBarber.isPending || updateBarber.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {editingBarber ? "Atualizar" : "Adicionar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={isServiceDialogOpen} onOpenChange={setServiceDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingService ? "Editar Serviço" : "Adicionar Serviço"}</DialogTitle>
            </DialogHeader>
            <Form {...serviceForm}>
              <form onSubmit={serviceForm.handleSubmit(onServiceSubmit)} className="space-y-4">
                <FormField name="name" control={serviceForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="price" control={serviceForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço</FormLabel>
                    <FormControl><Input {...field} type="number" step="0.01" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="duration_minutes" control={serviceForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (min)</FormLabel>
                    <FormControl><Input {...field} type="number" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="description" control={serviceForm.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl><Textarea {...field} /></FormControl>
                  </FormItem>
                )} />
                <div className="flex justify-end gap-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setServiceDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">{editingService ? "Atualizar" : "Adicionar"}</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;