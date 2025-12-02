// src/services/notifications/cancellation.notification.service.ts

import { notificationService } from './notification.service';
import { User, IUser } from '../../models/user.model'; // Asumiendo que esta es la ruta correcta

// Tipado mínimo para los Fixer/Requester (basado en user.model.ts)
interface INotificationUser extends IUser {
    telefono: string; // Para el campo de teléfono
}

export class CancellationNotificationService {
    private notifier = notificationService;

    // Helper para obtener los datos del usuario (Fixer o Requester)
    private async getUserDetailsById(userId: string): Promise<INotificationUser | null> {
        try {
            // Buscar el documento del usuario Fixer/Requester por su ID
            const userDoc = await User.findById(userId).lean() as (IUser & { whatsapp?: string }) | null;

            if (!userDoc) {
                console.error(`[Cancellation Service] Usuario con ID ${userId} no encontrado en DB.`);
                return null;
            }

            // Mapeo: Usar 'whatsapp' (si existe en el root del doc) o 'telefono'
            const phoneToUse = (userDoc as any).whatsapp || userDoc.telefono || ''; 

            if (!phoneToUse || !userDoc.email) {
                 console.error(`[Cancellation Service] Faltan datos de contacto para Usuario ${userId}.`);
                 return null;
            }
            
            return {
                ...userDoc,
                name: userDoc.name,
                email: userDoc.email,
                telefono: phoneToUse, 
            } as INotificationUser; 

        } catch (error) {
            console.error(`[Cancellation Service] Error al buscar usuario ${userId}:`, error);
            return null;
        }
    }

    /**
     * Helper para formatear fechas
     */
    private formatAppointmentDate(appointmentDate: Date | string): string {
        const dateObj = new Date(appointmentDate);
        const formatter = new Intl.DateTimeFormat('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // 24-hour format
        });

        let formattedDate = formatter.format(dateObj);
        return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    }
    
    /**
     * Envía la notificación al CLIENTE sobre la cancelación de la cita por parte del Fixer.
     */
    public async notifyFixerCancellation(
        requesterId: string,
        fixerId: string,
        appointmentDate: Date | string
    ): Promise<boolean> {
        const requester = await this.getUserDetailsById(requesterId);
        const fixer = await this.getUserDetailsById(fixerId);

        if (!requester || !fixer) {
            console.error("[Cancellation Service] No se pudo obtener la data completa del Fixer o Requester para notificar la cancelación.");
            return false;
        }

        const formattedDate = this.formatAppointmentDate(appointmentDate);
        
        // 2. Construir los mensajes
        const fixerName = fixer.name;
        const clientName = requester.name;
        const clientEmail = requester.email;
        const clientPhone = requester.telefono; // Usamos el campo de teléfono/whatsapp

        // Mensajes (utilizando la plantilla que proporcionaste)
        const whatsappMessage = `Hola ${clientName} lamentamos informarte que el fixer ${fixerName} no podra atender tu solicitud de la fecha: ${formattedDate}. Disculpa las molestias`;
        const emailSubject = 'Actualización sobre tu solicitud de servicio - Servineo';
        
        const emailBody = `
            <h1>Cancelación de Cita</h1>
            <p>Hola <strong>${clientName}</strong>,</p>
            <p>Lamentamos informarte que el fixer <strong>${fixerName}</strong> no podrá atender tu solicitud de servicio programada para la fecha:</p>
            <p><strong>${formattedDate}</strong></p>
            <p>Disculpa las molestias. Por favor, inicia una nueva búsqueda en la aplicación.</p>
        `;

        console.log(`[Notification] Iniciando proceso de notificación de CANCELACIÓN para ${clientName}...`);

        let whatsappSuccess = false;
        try {
             await this.notifier.whatsappProvider.send(clientPhone, whatsappMessage);
             whatsappSuccess = true;
             console.log(`[WhatsApp] Envío exitoso para ${clientName}.`);
        } catch (error) {
             console.warn(`[Alerta] El medio WhatsApp FALLÓ para ${clientPhone}.`, error);
        }

        let emailSuccess = false;
        try {
             await this.notifier.emailProvider.send(clientEmail, emailSubject, emailBody);
             emailSuccess = true;
             console.log(`[Email] Envío exitoso para ${clientEmail}.`);
        } catch (error) {
             console.warn(`[Alerta] El medio Email FALLÓ para ${clientEmail}.`, error);
        }

        if (!whatsappSuccess && !emailSuccess) {
            console.error('[FAILOVER CRÍTICO] Ambos medios de notificación fallaron. Se requiere intervención manual.');
            return false;
        }

        console.log('[Notification] Proceso de Cancelación finalizado. Al menos un medio fue exitoso.');
        return true;
    }
}