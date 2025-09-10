// src/components/CalendarView.tsx

import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { EventContentArg } from '@fullcalendar/core';
import { Appointment } from '@/types/api';

// Importe o CSS customizado
import './CalendarView.css'; 

interface CalendarViewProps {
  appointments: Appointment[];
  isLoading: boolean;
}

const CalendarView: React.FC<CalendarViewProps> = ({ appointments, isLoading }) => {
  // Transforma os dados dos seus agendamentos para o formato que o FullCalendar entende
  const events = appointments.map(apt => ({
    id: String(apt.id),
    title: `${apt.service_name} - ${apt.client_name}`,
    start: new Date(apt.datetime),
    end: new Date(new Date(apt.datetime).getTime() + apt.service_duration * 60000),
    extendedProps: {
      barber: apt.barber_name,
      client: apt.client_name,
      phone: apt.client_phone,
      notes: apt.notes, // <-- ADICIONADO: Passando as observações para o evento
    },
    backgroundColor: apt.status === 'APPROVED' ? '#10B981' : apt.status === 'PENDING' ? '#F59E0B' : '#EF4444', 
    borderColor: apt.status === 'APPROVED' ? '#059669' : apt.status === 'PENDING' ? '#D97706' : '#DC2626',
  }));

  if (isLoading) {
    return <div className="flex justify-center items-center h-96">A carregar o calendário...</div>;
  }

  return (
    <div className="p-4 bg-card rounded-lg shadow-elegant calendar-container">
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="timeGridWeek"
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay'
        }}
        events={events}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        locale="pt-br"
        buttonText={{
          today: 'Hoje',
          month: 'Mês',
          week: 'Semana',
          day: 'Dia',
        }}
        allDaySlot={false}
        slotMinTime="08:00:00"
        slotMaxTime="20:00:00"
        height="auto"
        slotDuration={'00:30:00'}
        slotLabelInterval={'01:00'}
        eventMinHeight={40}
        eventContent={renderEventContent}
      />
    </div>
  );
};

// Função para personalizar a aparência do evento
function renderEventContent(eventInfo: EventContentArg) {
  return (
    <div className="fc-event-custom-content">
      <div className="fc-event-time">{eventInfo.timeText}</div>
      <div className="fc-event-title-container">
        <p className="fc-event-title">{eventInfo.event.title}</p>
        <p className="fc-event-barber">Barbeiro: {eventInfo.event.extendedProps.barber}</p>
        {/* ADICIONADO: Renderiza as observações se elas existirem */}
        {eventInfo.event.extendedProps.notes && (
          <p className="fc-event-notes">
            Obs: {eventInfo.event.extendedProps.notes}
          </p>
        )}
      </div>
    </div>
  );
}

export default CalendarView;