import dotenv from 'dotenv';

dotenv.config();

export const SERVER_PORT = process.env.SERVER_PORT || 3000;
export const LOCATIONIQ_TOKEN = process.env.LOCATIONIQ_TOKEN;
export const ENV = {
  MONGO_USER: process.env.MONGO_USER,
  MONGO_PASS: process.env.MONGO_PASS,
  MONGO_HOST: process.env.MONGO_HOST,
  MONGO_DB: process.env.MONGO_DB,

  MONGODB_URI: process.env.MONGODB_URI,
  SMTP_HOST: process.env.SMTP_HOST_NOT,
  SMTP_PORT: parseInt(process.env.SMTP_PORT_NOT || '587'),
  SMTP_SECURE: process.env.SMTP_SECURE_NOT === 'true',
  SMTP_USER: process.env.SMTP_USER_NOT,
  SMTP_PASSWORD: process.env.SMTP_PASSWORD_NOT,
  SMTP_FROM: process.env.SMTP_FROM_NOT,
};
