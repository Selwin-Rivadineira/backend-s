import nodemailer from 'nodemailer';
import { ENV } from '../../config/env.config';

export class EmailProvider {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Validamos que las variables de NOTIFICACIÓN existan
    if (!ENV.SMTP_USER_NOT || !ENV.SMTP_PASSWORD_NOT) {
      console.error('Error: Faltan variables de entorno SMTP_USER_NOT o SMTP_PASSWORD_NOT');
      throw new Error('Configuración SMTP de Notificación incompleta'); 
    }

    // 1. Configuramos el "transporter" usando las credenciales NOT
    this.transporter = nodemailer.createTransport({
      host: ENV.SMTP_NOT_HOST,
      port: ENV.SMTP_NOT_PORT,
      secure: ENV.SMTP_NOT_SECURE,
      auth: {
        user: ENV.SMTP_USER_NOT,
        pass: ENV.SMTP_PASSWORD_NOT,
      },
    });

    this.verifyConnection();
  }

  // 2. Verificamos la conexión al iniciar (sin cambios en la lógica interna)
  private async verifyConnection() {
    try {
      if (this.transporter) {
        await this.transporter.verify();
        console.log('📧 Servidor SMTP de Gmail listo para enviar correos.');
      }
    } catch (error) {
      console.error('Error al verificar conexión SMTP:', error);
    }
  }

  // 3. Método para enviar el correo
  public async send(to: string, subject: string, htmlBody: string) {
    if (!this.transporter) {
      throw new Error('El transportador de email no está inicializado.');
    }
    
    try {
      const mailOptions = {
        // Usamos el remitente de NOTIFICACIONES
        from: `"Servineo" <${ENV.SMTP_FROM_NOT}>`, 
        to: to,
        subject: subject,
        html: htmlBody,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✅ Correo enviado. Message ID:', info.messageId);
      return info;

    } catch (error) {
      console.error('❌ Error al enviar el correo:', error);
      throw error;
    }
  }
}
