// src/services/appointment/update_appointment.service.ts

import * as dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDatabase } from '../../config/db.config';
import Appointment from '../../models/Appointment';

import { updateMeetingInvite, deleteMeetingEvent } from '../../utils/googleCalendarHelper';

// =======================================================
// Importar servicios de notificación
import { RescheduleNotificationService, IAppointmentData } from '../notifications/reschedule.notification.service';
import { CancellationNotificationService } from '../notifications/cancellation.notification.service';
// =======================================================

dotenv.config();

// Definimos la interfaz IAppointment tal como se espera en este archivo.
interface IAppointment extends IAppointmentData {
  _id: string;
  googleEventId?: string;
  schedule_state?: 'cancelled' | 'booked';
  current_requester_name: string;
  current_requester_phone: string;
  appointment_description: string;
  starting_time: Date;
  finishing_time?: Date;
  mail: string[];
  appointment_type: 'virtual' | 'presential';
  link_id?: string;
  display_name_location?: string;
  lat?: string;
  lon?: string;
  cancelled_fixer?: boolean;
  fixerId: string; // Se mantiene por IAppointmentData
  id_fixer: string; // Campo real en DB
  id_requester: string; // Campo real en DB
}

const rescheduleNotifier = new RescheduleNotificationService();
const cancellationNotifier = new CancellationNotificationService(); // 🎯 Nueva instancia

// * Fixed Endpoint Pichon: Refactorizar y probar en Postman.
export async function update_appointment_by_id(
  id: string,
  attributes: Partial<IAppointment>,
  reprogramReason?: string,
) {
  try {
    await connectDatabase();

    // 1. Obtener la cita original ANTES del cambio
    const originalAppointment = (await Appointment.findById(id).lean()) as unknown as IAppointment | null;

    if (!originalAppointment) {
      throw new Error('Appointment not found');
    }

    const oldDate = originalAppointment.starting_time;
    const oldModality = originalAppointment.appointment_type;

    // 2. Aplicar la actualización
    const updated_appointment = (await Appointment.findByIdAndUpdate(
      id,
      { $set: attributes },
      { new: true },
    ).lean()) as unknown as IAppointment | null;

    if (!updated_appointment) {
      return false;
    }

    // 3. Verificar si la actualización fue una REPROGRAMACIÓN
    const newDate = updated_appointment.starting_time;
    const newModality = updated_appointment.appointment_type;

    // Comparamos la fecha/hora y la modalidad
    const isRescheduled =
      oldDate.getTime() !== newDate.getTime() ||
      oldModality !== newModality;

    if (isRescheduled) {
      console.log('Reprogramación detectada. Llamando al servicio de notificación de REPROGRAMACIÓN...');
      
      // 4. Construir y enviar la notificación
      const oldData: IAppointmentData = {
          fixerId: originalAppointment.id_fixer, 
          current_requester_name: originalAppointment.current_requester_name,
          appointment_description: originalAppointment.appointment_description,
          starting_time: oldDate,
          appointment_type: oldModality
      };
      
      const newData: IAppointmentData = {
          fixerId: originalAppointment.id_fixer, 
          current_requester_name: updated_appointment.current_requester_name,
          appointment_description: updated_appointment.appointment_description,
          starting_time: newDate,
          appointment_type: newModality
      };

      await rescheduleNotifier.sendRescheduleNotification(
          oldData,
          newData,
          reprogramReason || 'El cliente no especificó un motivo.',
      );
    }

    // 5. Lógica de Google Calendar (Se mantiene la lógica original)
    if (updated_appointment && originalAppointment?.googleEventId) {
      const googleId = originalAppointment.googleEventId;

      // CANCELACION (Si el estado cambia a cancelled)
      if (attributes.schedule_state === 'cancelled') {
        console.log('Cancelacion detectada. Eliminando de Google Calendar...');
        await deleteMeetingEvent(googleId);
      }
      // EDICION DE DATOS (Si no es cancelacion)
      else {
        console.log('Edicion detectada. Actualizando Google Calendar...');

        const appt = updated_appointment;

        const desc = `Cliente: ${appt.current_requester_name}\nContacto: ${appt.current_requester_phone}\nDescripcion: ${appt.appointment_description}`;

        const start = appt.starting_time;
        const end =
          appt.finishing_time || new Date(new Date(start).getTime() + 60 * 60000);

        const title = 'Cita Servineo';

        await updateMeetingInvite(googleId, {
          emails: appt.mail,
          title: title,
          description: desc,
          start: start,
          end: end,
          isVirtual: appt.appointment_type === 'virtual',
          customLink: appt.link_id,
          locationName: appt.display_name_location,
          locationCoordinates:
            appt.lat && appt.lon ? { lat: appt.lat, lon: appt.lon } : undefined,
        });
      }
    }

    if (updated_appointment) {
      return true;
    } else {
      return false;
    }
  } catch (err) {
    throw new Error((err as Error).message);
  }
}

export async function fixer_cancell_appointment_by_id(appointment_id: string) {
    // 🎯 CÓDIGO ORIGINAL CON HOOK DE NOTIFICACIÓN DE CANCELACIÓN
    try {
        await connectDatabase();
    
        // cita original para tener el ID y datos de notificación
        const originalAppointment = (await Appointment.findById(
          appointment_id,
        )) as unknown as IAppointment | null;
    
        const result = (await Appointment.findByIdAndUpdate(
          appointment_id,
          {
            cancelled_fixer: true,
          },
          {
            new: true,
          },
        )) as unknown as IAppointment | null;
    
        // 🎯 Lógica para enviar notificación de cancelación 🎯
        if (result && originalAppointment) {
            await cancellationNotifier.notifyFixerCancellation(
                originalAppointment.id_requester as string, 
                originalAppointment.id_fixer as string, 
                originalAppointment.starting_time
            );
        }
        // ----------------------------------------------------

        //google
        if (result && originalAppointment?.googleEventId) {
          console.log('Fixer cancelo la cita. Eliminando evento de Google Calendar...');
          await deleteMeetingEvent(originalAppointment.googleEventId);
        }
    
        if (!result) {
          throw new Error('Appointment no econtrado');
        }
        return result;
      } catch (error) {
        throw new Error((error as Error).message);
      }
}

interface Availability {
  lunes: number[];
  martes: number[];
  miercoles: number[];
  jueves: number[];
  viernes: number[];
  sabado: number[];
  domingo: number[];
}

export async function update_fixer_availability(fixer_id: string, availability: Availability) {
    // CÓDIGO ORIGINAL COMPLETO
    try {
        const db = mongoose.connection.db!;
        const result = await db
          .collection('users')
          .updateOne(
            { _id: new mongoose.Types.ObjectId(fixer_id) },
            { $set: { availability: availability } },
          );
        return result;
      } catch (err) {
        throw new Error((err as Error).message);
      }
}