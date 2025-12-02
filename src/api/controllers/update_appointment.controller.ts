// src/api/controllers/update_appointment.controller.ts

import 'express';
import { Request, Response } from 'express';
import * as UpdateAppointmentService from '../../services/appointment/update_appointment.service';

// * Fixed Endpoint Pichon: Refactorizar y probar en Postman.
export async function updateAppointmentById(req: Request, res: Response) {
  try {
    const id = req.query.id;
    // 🎯 Extraer reprogramReason y dejar el resto en 'attributes'
    const { reprogramReason, ...attributes } = req.body; 

    if (!id || !attributes || typeof id !== 'string') {
      return res.status(400).json({ message: 'Missing parameters: required id and attributes.' });
    }

    // Filtrar nulls e undefineds del objeto 'attributes'
    const updateAttributes = Object.fromEntries(
      Object.entries(attributes).filter(([, value]) => value !== undefined && value !== null),
    );

    // 🎯 Pasar reprogramReason como tercer parámetro al servicio
    const modified = await UpdateAppointmentService.update_appointment_by_id(
        id, 
        updateAttributes,
        reprogramReason // Razón de la reprogramación
    );

    return res.status(200).json({ message: 'Updated succesfully', modified });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({
        message: 'Error updating appointment data.',
        modified: false,
        error: (err as Error).message,
      });
  }
}

export async function updateFixerAvailability(req: Request, res: Response) {
  try {
    const { fixer_id, availability } = req.body;
    if (!fixer_id || !availability) {
      return res
        .status(400)
        .json({ message: 'Missing parameters: required fixer_id and availability.' });
    }
    await UpdateAppointmentService.update_fixer_availability(fixer_id, availability);
    return res
      .status(200)
      .json({ message: 'Fixer availability updated successfully.', updated: true });
  } catch (err) {
    return res
      .status(500)
      .json({
        message: 'Error al actualizar disponibilidad: ' + (err as Error).message,
        updated: false,
      });
  }
}

export async function fixerCancellAppointment(req: Request, res: Response) {
  try {
    const { appointment_id } = req.query;
    if (!appointment_id || typeof appointment_id !== 'string') {
      return res.status(400).json({
        succedd: false,
        message: 'Missing query parameter',
      });
    }
    const modified = await UpdateAppointmentService.fixer_cancell_appointment_by_id(appointment_id);
    res.status(200).json({
      succeed: true,
      message: `Appointment with id: ${appointment_id} cancelled`,
      modified,
    });
  } catch (error) {
    res.status(500).json({
      succeed: false,
      message: 'Error cancelling appointment',
      error: (error as Error).message,
    });
  }
}