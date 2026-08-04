import { Request, Response } from "express";
import * as scheduleService from "../services/schedule.service.ts";

export const generateSchedules = async (req: Request, res: Response) => {
  try {
    const { selectedCourseIds, completedCourseIds, conditions } = req.body;

    if (!Array.isArray(selectedCourseIds)) {
      return res
        .status(400)
        .json({ error: "selectedCourseIds debe ser un arreglo de IDs" });
    }

    const result = await scheduleService.generateSchedules({
      selectedCourseIds,
      completedCourseIds: completedCourseIds || [],
      conditions,
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      error: "Error al generar combinaciones de horarios",
      details: error.message,
    });
  }
};
