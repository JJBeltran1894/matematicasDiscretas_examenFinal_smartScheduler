import { Request, Response } from "express";
import * as courseService from "../services/course.service.ts";

export const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await courseService.getAllCourses();
    res.json(courses);
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Error al obtener las materias", details: error.message });
  }
};

export const getCourse = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const course = await courseService.getCourseById(id);
    if (!course) {
      return res.status(404).json({ error: "Materia no encontrada" });
    }
    res.json(course);
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Error al obtener la materia", details: error.message });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  try {
    const newCourse = await courseService.createCourse(req.body);
    res.status(201).json(newCourse);
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Error al crear la materia", details: error.message });
  }
};

export const updateCourse = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const updated = await courseService.updateCourse(id, req.body);
    if (!updated) {
      return res
        .status(404)
        .json({ error: "Materia no encontrada para actualizar" });
    }
    res.json(updated);
  } catch (error: any) {
    res
      .status(500)
      .json({
        error: "Error al actualizar la materia",
        details: error.message,
      });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string, 10);
    const deleted = await courseService.deleteCourse(id);
    if (!deleted) {
      return res
        .status(404)
        .json({ error: "Materia no encontrada para eliminar" });
    }
    res.json({ message: "Materia eliminada exitosamente" });
  } catch (error: any) {
    res
      .status(500)
      .json({ error: "Error al eliminar la materia", details: error.message });
  }
};
