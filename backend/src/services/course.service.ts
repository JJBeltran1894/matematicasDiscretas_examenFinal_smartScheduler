import prisma from "../database/prisma.ts";

export interface CourseInput {
  name: string;
  day: string;
  startTime: string;
  endTime: string;
  modality: string;
  difficulty: string;
  credits: number;
  prerequisites?: number[];
}

export const getAllCourses = async () => {
  const courses = await prisma.courses.findMany({
    include: {
      prerequisites_prerequisites_course_idTocourses: true,
    },
  });

  return courses.map((c) => ({
    id: c.id,
    name: c.name,
    day: c.day,
    startTime: formatTime(c.start_time),
    endTime: formatTime(c.end_time),
    modality: c.modality,
    difficulty: c.difficulty,
    credits: c.credits,
    prerequisites: (c.prerequisites_prerequisites_course_idTocourses || []).map(
      (p) => p.prerequisite_course_id,
    ),
  }));
};

export const getCourseById = async (id: number) => {
  const course = await prisma.courses.findUnique({
    where: { id: Number(id) },
    include: {
      prerequisites_prerequisites_course_idTocourses: true,
    },
  });

  if (!course) return null;

  return {
    id: course.id,
    name: course.name,
    day: course.day,
    startTime: formatTime(course.start_time),
    endTime: formatTime(course.end_time),
    modality: course.modality,
    difficulty: course.difficulty,
    credits: course.credits,
    prerequisites: (
      course.prerequisites_prerequisites_course_idTocourses || []
    ).map((p) => p.prerequisite_course_id),
  };
};

const parseTimeToDate = (timeStr: string): Date => {
  if (!timeStr) return new Date("1970-01-01T08:00:00.000Z");
  if (timeStr.includes("T")) return new Date(timeStr);
  return new Date(`1970-01-01T${timeStr}:00.000Z`);
};

export const createCourse = async (data: CourseInput) => {
  const prereqIds = (data.prerequisites || []).map(Number);

  const newCourse = await prisma.courses.create({
    data: {
      name: data.name,
      day: data.day,
      start_time: parseTimeToDate(data.startTime),
      end_time: parseTimeToDate(data.endTime),
      modality: data.modality,
      difficulty: data.difficulty,
      credits: Number(data.credits),
    },
  });

  if (prereqIds.length > 0) {
    await prisma.prerequisites.createMany({
      data: prereqIds.map((prereqId) => ({
        course_id: newCourse.id,
        prerequisite_course_id: Number(prereqId),
      })),
    });
  }

  return getCourseById(newCourse.id);
};

export const updateCourse = async (id: number, data: CourseInput) => {
  const prereqIds = (data.prerequisites || []).map(Number);

  await prisma.courses.update({
    where: { id: Number(id) },
    data: {
      name: data.name,
      day: data.day,
      start_time: parseTimeToDate(data.startTime),
      end_time: parseTimeToDate(data.endTime),
      modality: data.modality,
      difficulty: data.difficulty,
      credits: Number(data.credits),
    },
  });

  // Limpieza y actualización de la tabla intermedia de prerrequisitos
  await prisma.prerequisites.deleteMany({
    where: { course_id: Number(id) },
  });

  if (prereqIds.length > 0) {
    await prisma.prerequisites.createMany({
      data: prereqIds.map((prereqId) => ({
        course_id: Number(id),
        prerequisite_course_id: Number(prereqId),
      })),
    });
  }

  return getCourseById(Number(id));
};

export const deleteCourse = async (id: number) => {
  try {
    const courseId = Number(id);

    // 1. Eliminar referencias cruzadas en la tabla de prerrequisitos
    await prisma.prerequisites.deleteMany({
      where: {
        OR: [{ course_id: courseId }, { prerequisite_course_id: courseId }],
      },
    });

    // 2. Eliminar la materia
    await prisma.courses.delete({
      where: { id: courseId },
    });

    return true;
  } catch (err) {
    console.error("Error al eliminar materia:", err);
    return false;
  }
};

const formatTime = (time: Date | string): string => {
  if (typeof time === "string") return time;
  return time.toISOString().substring(11, 16);
};
