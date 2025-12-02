// src/services/notifications/reschedule.notification.service.ts

// Interfaces mínimas de datos que se mueven entre servicios
export interface IAppointmentData {
  fixerId: string;
  current_requester_name: string;
  appointment_description: string;
  starting_time: Date;
  appointment_type: 'virtual' | 'presential';
}

// Interfaces mínimas para la notificación (Fixer)
interface IFixerDetails {
    name: string;
    email: string;
    phone: string;
}

// 🎯 CAMBIO CLAVE: Importar el modelo de usuario y la instancia singleton
import { User, IUser } from '../../models/user.model'; // Asumiendo que esta es la ruta correcta
import { notificationService } from './notification.service'; 


// 🎯 CAMBIO CLAVE: Implementación real de la búsqueda del Fixer
async function getFixerDetailsById(fixerId: string): Promise<IFixerDetails | null> {
    console.log(`[Notification Service] Buscando detalles del Fixer ID: ${fixerId}...`);
    
    try {
        // Buscar el documento del usuario Fixer por su ID
        const fixerDoc = await User.findById(fixerId).lean() as (IUser & { whatsapp?: string }) | null;

        if (!fixerDoc) {
            console.error(`[Notification Service] Fixer con ID ${fixerId} no encontrado en DB.`);
            return null;
        }

        // Devolvemos los campos requeridos para la notificación
        // Nota: Asumo que el número de WhatsApp está en 'telefono' o en el campo 'whatsapp'
        // Por la data que enviaste, lo buscaré en `whatsapp` (si lo tienes en el root del doc) o en `telefono`
        const phoneToUse = (fixerDoc as any).whatsapp || fixerDoc.telefono; 

        if (!phoneToUse || !fixerDoc.email) {
             console.error(`[Notification Service] Faltan datos de contacto para Fixer ${fixerId}.`);
             return null;
        }
        
        return {
            name: fixerDoc.name,
            email: fixerDoc.email, 
            phone: phoneToUse, 
        };
        
    } catch (error) {
        console.error(`[Notification Service] Error al buscar Fixer ${fixerId}:`, error);
        return null;
    }
}


export class RescheduleNotificationService {
  // 🎯 Usamos la instancia de NotificationService que ya tiene los proveedores inicializados
  private notificationService = notificationService; 

  // Helper para formatear fechas
  private formatAppointmentDate(date: Date): string {
    return date.toLocaleString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  // Helper para obtener el texto de la modalidad
  private getModalityText(modality: 'virtual' | 'presential'): string {
    return modality === 'virtual' ? 'Virtual' : 'Presencial';
  }

  /**
   * Envía la notificación al Fixer sobre la reprogramación de la cita.
   */
  public async sendRescheduleNotification(
    oldAppointment: IAppointmentData,
    newAppointment: IAppointmentData,
    reprogramReason: string,
  ): Promise<void> {
    
    // Obtener los datos completos del fixer usando el ID
    const fixer = await getFixerDetailsById(newAppointment.fixerId);
    
    if (!fixer) {
        console.error(`[Notification Service] No se pudo encontrar al fixer con ID: ${newAppointment.fixerId}. Notificación omitida.`);
        return;
    }
      
    const fixerName = fixer.name;
    const requesterName = newAppointment.current_requester_name;

    const oldDateText = this.formatAppointmentDate(oldAppointment.starting_time);
    const newDateText = this.formatAppointmentDate(newAppointment.starting_time);
    const modalityText = this.getModalityText(newAppointment.appointment_type);
    const detailsText = newAppointment.appointment_description; 

    // Cuerpo de WhatsApp (Formato solicitado)
    const whatsappBody = `*🔄 CITA REPROGRAMADA*\n\nHola *${fixerName}*,\n\nEl cliente *${requesterName}* ha reprogramado su cita.\n\n*Motivo:* ${reprogramReason}\n\n*Fecha anterior:*\n${oldDateText}\n\n*Nueva fecha:*\n${newDateText}\n\n*Servicio:* ${detailsText}\n*Modalidad:* ${modalityText}\n\nPor favor, revisa tu calendario en la app.`;

    // Cuerpo de Email (Formato HTML solicitado)
    const emailSubject = `Cita Reprogramada por ${requesterName}`;
    const emailBody = `
      <h1>Cita Reprogramada</h1>
      <p>Hola <strong>${fixerName}</strong>,</p>
      <p>El cliente <strong>${requesterName}</strong> ha reprogramado su cita.</p>
      <p><strong>Motivo:</strong> ${reprogramReason}</p>
      <h2>Detalles de la Cita:</h2>
      <ul>
        <li><strong>Fecha anterior:</strong> ${oldDateText}</li>
        <li><strong>Nueva fecha:</strong> ${newDateText}</li>
        <li><strong>Servicio:</strong> ${detailsText}</li>
        <li><strong>Modalidad:</strong> ${modalityText}</li>
      </ul>
      <p>Por favor, revisa tu calendario en la app.</p>
    `;

    // Enviar notificaciones usando los proveedores expuestos por notificationService
    await this.notificationService.whatsappProvider.send( 
      fixer.phone,
      whatsappBody,
    );

    await this.notificationService.emailProvider.send( 
      fixer.email,
      emailSubject,
      emailBody,
    );
  }
}