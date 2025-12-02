import dotenv from 'dotenv';

dotenv.config();

export const SERVER_PORT = process.env.SERVER_PORT || 3000;
export const LOCATIONIQ_TOKEN = process.env.LOCATIONIQ_TOKEN;

// 🎯 Definimos las propiedades de HOST/PORT/SECURE en variables locales
//    ya que serán las mismas para ambos correos (mismo proveedor, Gmail)
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';

export const ENV = {
  MONGO_USER: process.env.MONGO_USER,
  MONGO_PASS: process.env.MONGO_PASS,
  MONGO_HOST: process.env.MONGO_HOST,
  MONGO_DB: process.env.MONGO_DB,

  MONGODB_URI: process.env.MONGODB_URI,
  
  // --- CREDENCIALES PRIMARIAS (servineo.app@gmail.com) ---
  // Usado por servicios generales (ej. forgot password)
  SMTP_HOST: SMTP_HOST,
  SMTP_PORT: SMTP_PORT,
  SMTP_SECURE: SMTP_SECURE,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASSWORD: process.env.SMTP_PASS, // Se asume que usa SMTP_PASS
  SMTP_FROM: process.env.FROM_EMAIL,    // Se asume que usa FROM_EMAIL
  
  // --- CREDENCIALES DE NOTIFICACIONES (servineo2025@gmail.com) ---
  // Usado por el NotificationService
  SMTP_NOT_HOST: SMTP_HOST, // Reutilizamos la configuración del servidor
  SMTP_NOT_PORT: SMTP_PORT,
  SMTP_NOT_SECURE: SMTP_SECURE,
  SMTP_USER_NOT: process.env.SMTP_USER_NOT,
  SMTP_PASSWORD_NOT: process.env.SMTP_PASSWORD_NOT,
  SMTP_FROM_NOT: process.env.SMTP_FROM_NOT,
};
