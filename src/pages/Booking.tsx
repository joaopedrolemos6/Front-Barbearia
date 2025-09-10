// src/pages/Booking.tsx

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast as sonnerToast } from "sonner";
import { CalendarIcon, Scissors, User, Loader2, Phone, Mail, Users } from "lucide-react";
import { format, set, isToday, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { useServices } from "@/hooks/useServices";
import { useAvailableBarbers } from "@/hooks/useBarbers";
import { useCreateAppointment } from "@/hooks/useAppointments";
import { Barber, Service } from "@/types/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Booking = () => {
  const [step, setStep] = useState(1);

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [selectedBarber, setSelectedBarber] = useState("");
  const [customerData, setCustomerData] = useState({ name: "", phone: "", email: "" });
  const [notes, setNotes] = useState("");

  const { data: services = [], isLoading: loadingServices } = useServices();

  const selectedDateTimeISO = useMemo(() => {
    if (!selectedDate || !selectedTime) return "";
    const [hours, minutes] = selectedTime.split(':').map(Number);
    return set(selectedDate, { hours, minutes }).toISOString();
  }, [selectedDate, selectedTime]);

  const { data: availableBarbers = [], isLoading: loadingBarbers } =
    useAvailableBarbers(selectedDateTimeISO, Number(selectedService));

  const createAppointment = useCreateAppointment();

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return [];

    const allTimeSlots = [
      "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
      "11:00", "11:30", "14:00", "14:30", "15:00", "15:30",
      "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00"
    ];

    if (!isToday(selectedDate)) {
      return allTimeSlots;
    }

    const now = new Date();
    return allTimeSlots.filter(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const slotDateTime = set(selectedDate, { hours, minutes });
      return !isPast(slotDateTime);
    });
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate) {
      setSelectedTime("");
    }
  }, [selectedDate]);

  const handleDateTimeAndServiceSelection = () => {
    if (selectedDate && selectedTime && selectedService) {
      setStep(2);
    } else {
      sonnerToast.error("Campos obrigatórios", {
        description: "Por favor, selecione o serviço, a data e o horário."
      });
    }
  };

  const handleBooking = async () => {
    if (!selectedBarber || !customerData.name || !customerData.phone) {
      sonnerToast.error("Campos obrigatórios", {
        description: "Por favor, escolha um barbeiro e preencha seus dados.",
      });
      return;
    }

    let finalBarberId = Number(selectedBarber);
    if (selectedBarber === 'any' && availableBarbers.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableBarbers.length);
      finalBarberId = availableBarbers[randomIndex].id;
    }

    try {
      await createAppointment.mutateAsync({
        client: {
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email || undefined,
        },
        appointment: {
          barberId: finalBarberId,
          serviceId: Number(selectedService),
          datetime: selectedDateTimeISO,
          notes: notes || undefined,
        },
      });

      setStep(1);
      setSelectedDate(undefined);
      setSelectedTime("");
      setSelectedService("");
      setSelectedBarber("");
      setCustomerData({ name: "", phone: "", email: "" });
      setNotes("");
    } catch (error) {}
  };

  const selectedServiceData = services.find(s => s.id === Number(selectedService));
  const selectedBarberData = availableBarbers.find(b => b.id === Number(selectedBarber));

  return (
    <div className="min-h-screen bg-background py-8 sm:py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <Link to="/" className="inline-flex items-center gap-2 text-primary hover:text-secondary transition-colors mb-6 sm:mb-8">
            <Scissors className="w-5 h-5" /><span className="text-lg font-medium">BarbershopPro</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-light mb-4 text-foreground">Agendar Serviço</h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">Escolha seu barbeiro, serviço e horário preferido</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">

            {/* Etapa 1: Serviço e Horário */}
            <Card className={`p-8 bg-card border shadow-elegant transition-opacity ${step === 1 ? 'opacity-100' : 'opacity-50'}`}>
              <h2 className="text-xl font-medium mb-8 flex items-center gap-3">
                <Scissors className="w-5 h-5 text-secondary" /> 1. Escolha o Serviço e Horário
              </h2>
              <div className="space-y-6">
                {loadingServices ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
                ) : (
                  <Select value={selectedService} onValueChange={setSelectedService}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Escolha um serviço..." />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map(service => (
                        <SelectItem key={service.id} value={String(service.id)}>
                          <div className="flex justify-between w-full">
                            <span>{service.name} ({service.duration_minutes} min)</span>
                            <span className="font-semibold ml-4">R$ {service.price.toFixed(2)}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-base font-medium mb-3 block">Selecione a Data</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start h-12">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Escolha uma data"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={setSelectedDate}
                          disabled={(date) => date < new Date() && !isToday(date)}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-base font-medium mb-3 block">Horário</Label>
                    <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Selecione o horário" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableTimeSlots.map((time) => (
                          <SelectItem key={time} value={time}>{time}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <Button onClick={handleDateTimeAndServiceSelection} disabled={loadingServices}>
                  Encontrar Barbeiros
                </Button>
              </div>
            </Card>

            {/* Etapa 2: Escolha do Barbeiro */}
            <Card className={`p-8 bg-card border shadow-elegant transition-opacity ${step === 2 ? 'opacity-100' : 'opacity-50'}`}>
              <button onClick={() => setStep(1)} className="text-sm text-muted-foreground mb-4">← Voltar</button>
              <h2 className="text-xl font-medium mb-8 flex items-center gap-3">
                <User className="w-5 h-5 text-secondary" /> 2. Escolha o Barbeiro
              </h2>
              {loadingBarbers ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div
                    onClick={() => setSelectedBarber('any')}
                    className={`p-6 border rounded-lg cursor-pointer flex flex-col items-center justify-center gap-3 text-center ${selectedBarber === 'any' ? 'border-secondary bg-secondary/5' : 'hover:border-secondary/30'}`}
                  >
                     <Avatar className="w-16 h-16">
                        <AvatarFallback><Users className="w-8 h-8" /></AvatarFallback>
                      </Avatar>
                    <div>
                      <h3 className="font-medium">Qualquer Barbeiro</h3>
                      <p className="text-sm text-muted-foreground mt-1">Encontraremos o melhor profissional.</p>
                    </div>
                  </div>
                  {availableBarbers.map(barber => (
                    <div
                      key={barber.id}
                      onClick={() => setSelectedBarber(String(barber.id))}
                      className={`p-6 border rounded-lg cursor-pointer flex flex-col items-center justify-center gap-3 text-center ${selectedBarber === String(barber.id) ? 'border-secondary bg-secondary/5' : 'hover:border-secondary/30'}`}
                    >
                      <Avatar className="w-16 h-16">
                        {/* MODIFICADO: Adicionado optional chaining */}
                        <AvatarImage src={barber.profile?.avatar_url} />
                        <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">{barber.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{barber.specialty}</p>
                      </div>
                    </div>
                  ))}
                  {availableBarbers.length === 0 && (
                    <p className="sm:col-span-2 text-center text-muted-foreground">
                      Nenhum barbeiro disponível para este horário.
                    </p>
                  )}
                </div>
              )}
            </Card>

            {/* Etapa 3: Dados do Cliente */}
            <Card className={`p-8 bg-card border shadow-elegant transition-opacity ${step === 2 && selectedBarber ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
              <h2 className="text-xl font-medium mb-8 flex items-center gap-3">
                <Mail className="w-5 h-5 text-secondary" /> 3. Seus Dados
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-base font-medium">Nome *</Label>
                  <Input id="name" value={customerData.name} onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })} className="mt-2 h-12" placeholder="Digite seu nome" />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-base font-medium">Telefone *</Label>
                  <Input id="phone" value={customerData.phone} onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })} className="mt-2 h-12" placeholder="(11) 99999-9999" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="email" className="text-base font-medium">Email (opcional)</Label>
                  <Input id="email" type="email" value={customerData.email} onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })} className="mt-2 h-12" placeholder="seu@email.com" />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="notes" className="text-base font-medium">Observações (opcional)</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Alguma preferência ou observação especial?" />
                </div>
              </div>
            </Card>
          </div>

          {/* Resumo */}
          <div className="lg:col-span-1">
            <Card className="p-6 sm:p-8 sticky top-6 bg-card border border-border shadow-elegant">
              <h2 className="text-lg sm:text-xl font-medium mb-6 sm:mb-8">Resumo</h2>
              <div className="space-y-4">
                {customerData.name && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Cliente:</span><span className="font-medium">{customerData.name}</span></div>
                )}
                {selectedBarberData && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Barbeiro:</span>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        {/* MODIFICADO: Adicionado optional chaining */}
                        <AvatarImage src={selectedBarberData.profile?.avatar_url} />
                        <AvatarFallback>{selectedBarberData.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{selectedBarberData.name}</span>
                    </div>
                  </div>
                )}
                {selectedServiceData && (
                  <>
                    <div className="flex justify-between"><span className="text-muted-foreground">Serviço:</span><span className="font-medium">{selectedServiceData.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Duração:</span><span className="font-medium">{selectedServiceData.duration_minutes} min</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Valor:</span><span className="font-bold text-secondary text-lg">R$ {selectedServiceData.price.toFixed(2)}</span></div>
                  </>
                )}
                {selectedDate && selectedTime && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Data/Hora:</span>
                    <div className="text-right">
                      <div className="font-medium">{format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}</div>
                      <div className="text-xs text-muted-foreground">{selectedTime}</div>
                    </div>
                  </div>
                )}
              </div>
              <hr className="my-6" />
              <Button
                onClick={handleBooking}
                disabled={createAppointment.isPending || step < 2 || !selectedBarber}
                variant="hero"
                size="lg"
                className="w-full h-12"
              >
                {createAppointment.isPending ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Confirmando...</>) : ("Confirmar Agendamento")}
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-4">* Campos obrigatórios</p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;