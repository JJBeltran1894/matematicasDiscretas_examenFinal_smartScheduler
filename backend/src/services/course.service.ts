import prisma from "../database/prisma.ts";

export interface CourseInput {
  name: string;
  day: string;
  start_time: string;
  end_time: string;
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
    startTime: c.start_time,
    endTime: c.end_time,
    modality: c.modality,
    difficulty: c.difficulty,
    credits: c.credits,
    prerequisites: c.prerequisites_prerequisites_course_idTocourses.map(
      (p) => p.prerequisite_course_id,
    ),
  }));
};

export const getCourseById = async (id: number) => {
  const course = await prisma.courses.findUnique({
    where: { id },
    include: {
      prerequisites_prerequisites_course_idTocourses: true,
    },
  });

  if (!course) return null;

  return {
    id: course.id,
    name: course.name,
    day: course.day,
    startTime: course.start_time,
    endTime: course.end_time,
    modality: course.modality,
    difficulty: course.difficulty,
    credits: course.credits,
    prerequisites: course.prerequisites_prerequisites_course_idTocourses.map(
      (p) => p.prerequisite_course_id,
    ),
  };
};

export const createCourse = async (data: CourseInput) => {
  const newCourse = await prisma.courses.create({
    data: {
      name: data.name,
      day: data.day,
      start_time: data.start_time,
      end_time: data.end_time,
      modality: data.modality,
      difficulty: data.difficulty,
      credits: Number(data.credits),
    },
  });

  if (data.prerequisites && data.prerequisites.length > 0) {
    await prisma.prerequisites.createMany({
      data: data.prerequisites.map((prereqId) => ({
        course_id: newCourse.id,
        prerequisite_course_id: prereqId,
      })),
    });
  }

  return getCourseById(newCourse.id);
};

export const updateCourse = async (id: number, data: CourseInput) => {
  await prisma.courses.update({
    where: { id },
    data: {
      name: data.name,
      day: data.day,
      start_time: data.start_time,
      end_time: data.end_time,
      modality: data.modality,
      difficulty: data.difficulty,
      credits: Number(data.credits),
    },
  });

  // Actualizamos la tabla de prerrequisitos
  await prisma.prerequisites.deleteMany({
    where: { course_id: id },
  });

  if (data.prerequisites && data.prerequisites.length > 0) {
    await prisma.prerequisites.createMany({
      data: data.prerequisites.map((prereqId) => ({
        course_id: id,
        prerequisite_course_id: prereqId,
      })),
    });
  }

  return getCourseById(id);
};

export const deleteCourse = async (id: number) => {
  try {
    await prisma.courses.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
};
