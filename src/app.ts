import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/db.config';
import mongoose from 'mongoose';

// Importación de rutas
import jobOfertRoutes from './api/routes/jobOfert.routes';
import newoffersRoutes from './api/routes/newOffers.routes';
import fixerRoutes from './api/routes/fixer.routes';
import jobsRoutes from './api/routes/jobs.routes';
import activityRoutes from './api/routes/activities.routes'; // Corregido path relativo
import CreateRoutes from './api/routes/create_appointment.routes';
import ReadRoutes from './api/routes/read_appointment.routes';
import UpdateRoutes from './api/routes/update_appointment.routes';
import LocationRoutes from './api/routes/location.routes';
import GetScheduleRoutes from './api/routes/get_schedule.routes';
import searchRoutes from './api/routes/search.routes';
import trackingRoutes from './api/routes/tracking-appointments.routes';
import experienceRoutes from './routes/experience.routes';
import userProfileRoutes from './routes/userProfile.routes';
import userRoutes from './routes/user.routes';
import registrarDatosRouter from './api/routes/userManagement/registrarDatos.routes'; // Corregido path relativo
import fotoPerfilRouter from './api/routes/userManagement/fotoPerfil.routes'; // Corregido path relativo
import googleRouter from './api/routes/userManagement/google.routes'; // Corregido path relativo
import ubicacionRouter from './api/routes/userManagement/ubicacion.routes'; // Corregido path relativo
import authRouter from './api/routes/userManagement/login.routes'; // Corregido path relativo
import modificarDatosRouter from './api/routes/userManagement/modificarDatos.routes'; // Corregido path relativo
import nominatimRouter from './api/routes/userManagement/sugerencias.routes'; // Corregido path relativo
import deviceRouter from './api/routes/userManagement/device.routes'; // Corregido path relativo
import cambiarContrasenaRouter from './api/routes/userManagement/editarContraseña.routes'; // Corregido path relativo
import cerrarSesionesRouter from './api/routes/userManagement/cerrarSesiones.routes'; // Corregido path relativo
import ultimoCambioRouter from './api/routes/userManagement/ultimoCambio.routes'; // Corregido path relativo
import githubAuthRouter from './api/routes/userManagement/github.routes'; // Corregido path relativo
import discordRoutes from './api/routes/userManagement/discord.routes'; // Corregido path relativo
import clienteRouter from './api/routes/userManagement/cliente.routes'; // Corregido path relativo
import obtenerContrasenaRouter from './api/routes/userManagement/obtener.routes'; // Corregido path relativo
import portfolioRoutes from './routes/portfolio.routes'; // Corregido path relativo
import routerUser from './api/routes/user.routes'; // Corregido path relativo

const app = express();

// --- CONFIGURACIÓN DE CORS ---
app.use(
  cors({
    origin: '*', // Permitir todo para evitar problemas de conexión iniciales
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- RUTAS DE HEALTH CHECK (Para que Render sepa que estamos vivos) ---
app.get('/', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'connected' : 'disconnected';
  
  res.status(200).json({
    message: 'Servineo API',
    status: 'running',
    database: dbStatus
  });
});

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  res.status(200).json({
    status: 'ok',
    database: dbState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Middleware de logs
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// --- DEFINICIÓN DE RUTAS ---
app.use('/api', searchRoutes);
app.use('/api/devmaster', jobOfertRoutes);
app.use('/api/newOffers', newoffersRoutes);
app.use('/api/fixers', fixerRoutes);
app.use('/api', activityRoutes);
app.use('/api', jobsRoutes);
app.use('/api/admin', trackingRoutes);
app.use('/api/experiences', experienceRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/controlC/google', googleRouter);
app.use('/api/controlC/ubicacion', ubicacionRouter);
app.use('/api/controlC/auth', authRouter);
app.use('/api/controlC/registro', registrarDatosRouter);
app.use('/api/user-profiles', userProfileRoutes);
app.use('/api/user', userRoutes);
app.use('/api/controlC/modificar-datos', modificarDatosRouter);
app.use('/api/controlC/sugerencias', nominatimRouter);
app.use('/api/controlC/cambiar-contrasena', cambiarContrasenaRouter);
app.use('/api/controlC/cerrar-sesiones', cerrarSesionesRouter);
app.use('/api/controlC/ultimo-cambio', ultimoCambioRouter);
app.use('/api/controlC/foto-perfil', fotoPerfilRouter);
app.use('/api/controlC/obtener-password', obtenerContrasenaRouter);
app.use('/auth', githubAuthRouter);
app.use('/auth', discordRoutes);
app.use('/api/controlC/cliente', clienteRouter);
// app.use('/api/user', routerUser); // OJO: Tienes '/api/user' duplicado arriba. Comenta uno si es necesario.
app.use('/api/user-v2', routerUser); // Sugerencia: Si son rutas distintas, usa otro path.
app.use('/api/location', LocationRoutes);
app.use('/api/crud_create', CreateRoutes);
app.use('/api/crud_read', ReadRoutes);
app.use('/api/crud_update', UpdateRoutes);
app.use('/api/crud_read', GetScheduleRoutes);

// Ruta de devices integrada
app.use('/devices', deviceRouter);

// Middleware para manejar 404 (Not Found)
app.use((req, res) => {
  console.log('Not found:', req.method, req.originalUrl);
  res.status(404).send({
    message: 'route not found',
  });
});

export default app;
