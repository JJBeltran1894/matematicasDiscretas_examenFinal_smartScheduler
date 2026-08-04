import prisma from "../database/prisma.ts";

export interface ScheduleConditions {
  numberOfCourses?: number; // r: cantidad exacta de materias por horario
  maxCredits?: number;
  maxDifficultCourses?: number;
  preferredModality?: string;
  requiredCourseIds?: number[]; // IDs de materias obligatorias
}

export interface GenerateScheduleInput {
  selectedCourseIds: number[]; // materias seleccionadas (n)
  completedCourseIds: number[]; // materias aprobadas
  conditions?: ScheduleConditions;
}

export interface CourseFormatted {
  id: number;
  name: string;
  day: string;
  startTime: string;
  endTime: string;
  modality: string;
  difficulty: string;
  credits: number;
  prerequisites: number[];
}

// Util: Factorial para cálculo de C(n,r)
const factorial = (n: number): number => {
  if (n <= 1) return 1;
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
};

// Util: Cálculo Combinatorio C(n,r)
const calculateCombinationsCount = (n: number, r: number): number => {
  if (r <= 0 || r > n) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
};

// Util: Convierte horas a minutos
const timeToMinutes = (timeStr: string): number => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

// MATEMATICA 1: Implicacion Logica
// Comprueba si la materia cumple con los prerrequisitos
const satisfiesPrerequisites = (
  course: CourseFormatted,
  completedIds: number[],
): boolean => {
  return course.prerequisites.every((prereqId) =>
    completedIds.includes(prereqId),
  );
};

// MATEMATICA 2: Teoria de Conjuntos - Interseccion de horarios
// Retorna true si dos materias se cruzan en dia y hora
const doCoursesOverlap = (
  c1: CourseFormatted,
  c2: CourseFormatted,
): boolean => {
  if (c1.day === c2.day) {
    const start1 = timeToMinutes(c1.startTime);
    const end1 = timeToMinutes(c1.endTime);
    const start2 = timeToMinutes(c2.startTime);
    const end2 = timeToMinutes(c2.endTime);
    return start1 < end2 && start2 < end1;
  }
  return false;
};

// Comprueba si un horario completo presenta al menos un cruce
const hasScheduleConflicts = (schedule: CourseFormatted[]): boolean => {
  for (let i = 0; i < schedule.length; i++) {
    for (let j = i + 1; j < schedule.length; j++) {
      if (doCoursesOverlap(schedule[i], schedule[j])) {
        return true;
      }
    }
  }
  return false;
};

// MATEMATICA 3: Generación exhaustiva de subconjuntos de tamaño exacto r
const generateAllCombinations = (
  courses: CourseFormatted[],
  targetSize: number,
): CourseFormatted[][] => {
  const results: CourseFormatted[][] = [];

  const combine = (startIndex: number, current: CourseFormatted[]) => {
    if (targetSize > 0 && current.length === targetSize) {
      results.push([...current]);
      return;
    }

    if (targetSize === 0 && current.length > 0) {
      results.push([...current]);
    }

    for (let i = startIndex; i < courses.length; i++) {
      current.push(courses[i]);
      combine(i + 1, current);
      current.pop();
    }
  };

  combine(0, []);
  return results;
};

// Servicio Principal
export const generateSchedules = async (input: GenerateScheduleInput) => {
  const { selectedCourseIds, completedCourseIds, conditions } = input;

  const r = conditions?.numberOfCourses || 0;
  const maxCredits = conditions?.maxCredits || 25;
  const maxDifficult = conditions?.maxDifficultCourses ?? 99;
  const preferredModality = conditions?.preferredModality || "Todas";
  const requiredIds = conditions?.requiredCourseIds || [];

  const discardedReasons: string[] = [];

  // Mapeo de IDs a Nombres de materias para mostrar nombres reales en descartes
  const allCoursesInDb = await prisma.courses.findMany({
    select: { id: true, name: true },
  });
  const courseNameMap = new Map<number, string>(
    allCoursesInDb.map((c) => [c.id, c.name]),
  );

  // 1. Obtener de la BD todas las materias seleccionadas con sus prerrequisitos
  const rawCourses = await prisma.courses.findMany({
    where: { id: { in: selectedCourseIds } },
    include: {
      prerequisites_prerequisites_course_idTocourses: true,
    },
  });

  // Formatear la lista de materias
  const availableCourses: CourseFormatted[] = rawCourses.map((c) => ({
    id: c.id,
    name: c.name,
    day: c.day,
    startTime: c.start_time.toISOString().substring(11, 16),
    endTime: c.end_time.toISOString().substring(11, 16),
    modality: c.modality,
    difficulty: c.difficulty,
    credits: c.credits,
    prerequisites: c.prerequisites_prerequisites_course_idTocourses.map(
      (p) => p.prerequisite_course_id,
    ),
  }));

  // 2. Filtrar materias elegibles por prerrequisitos y modalidad
  const eligibleCourses: CourseFormatted[] = [];

  for (const course of availableCourses) {
    if (!satisfiesPrerequisites(course, completedCourseIds)) {
      // Traducir IDs de prerrequisitos a nombres reales
      const missingPrereqNames = course.prerequisites
        .filter((pId) => !completedCourseIds.includes(pId))
        .map((pId) => courseNameMap.get(pId) || `Materia #${pId}`);

      discardedReasons.push(
        `❌ Materia "${course.name}" descartada: No cumple prerrequisitos (Requiere tener aprobada: ${missingPrereqNames.join(", ")}).`,
      );
      continue;
    }

    if (
      preferredModality !== "Todas" &&
      course.modality !== preferredModality
    ) {
      discardedReasons.push(
        `❌ Materia "${course.name}" descartada: Modalidad (${course.modality}) no coincide con la condición elegida (${preferredModality}).`,
      );
      continue;
    }

    eligibleCourses.push(course);
  }

  const n = eligibleCourses.length;
  const targetR = r > 0 ? r : n;
  const totalTheoreticalCombinations = calculateCombinationsCount(n, targetR);

  // Generar las C(n,r) combinaciones completas
  const allCombinations = generateAllCombinations(eligibleCourses, targetR);

  const validSchedules: CourseFormatted[][] = [];
  let overlapDiscardCount = 0;
  let missingRequiredCount = 0;
  let creditsExceededCount = 0;
  let difficultExceededCount = 0;

  // Nombres de las materias obligatorias solicitadas
  const requiredNames = requiredIds
    .map((id) => courseNameMap.get(id))
    .filter(Boolean)
    .join(", ");

  // 3. Evaluación sistemática de reglas proposicionales sobre cada combinación
  for (const schedule of allCombinations) {
    const hasConflict = hasScheduleConflicts(schedule);
    const hasAllRequired = requiredIds.every((reqId) =>
      schedule.some((c) => c.id === reqId),
    );
    const totalCredits = schedule.reduce((sum, c) => sum + c.credits, 0);
    const difficultCount = schedule.filter(
      (c) => c.difficulty.toLowerCase() === "alta",
    ).length;

    if (hasConflict) {
      overlapDiscardCount++;
    } else if (!hasAllRequired) {
      missingRequiredCount++;
    } else if (totalCredits > maxCredits) {
      creditsExceededCount++;
    } else if (difficultCount > maxDifficult) {
      difficultExceededCount++;
    } else {
      validSchedules.push(schedule);
    }
  }

  // Registrar explicaciones detalladas
  if (overlapDiscardCount > 0) {
    discardedReasons.push(
      `⚠️ Se descartaron ${overlapDiscardCount} ramas por conflicto/cruce de horario (A ∩ B ≠ ∅).`,
    );
  }
  if (missingRequiredCount > 0) {
    discardedReasons.push(
      `⚠️ Se descartaron ${missingRequiredCount} opciones por no contener todas las materias obligatorias requeridas (O ⊈ H. Obligatorias exigidas: ${requiredNames || "Ninguna"}).`,
    );
  }
  if (creditsExceededCount > 0) {
    discardedReasons.push(
      `⚠️ Se descartaron ${creditsExceededCount} opciones por superar la condición de máximo ${maxCredits} créditos.`,
    );
  }
  if (difficultExceededCount > 0) {
    discardedReasons.push(
      `⚠️ Se descartaron ${difficultExceededCount} opciones por superar la condición D: contienen más de ${maxDifficult} materia(s) de dificultad Alta.`,
    );
  }

  // Ordenar combinaciones válidas por créditos/materias
  validSchedules.sort((a, b) => b.length - a.length);

  return {
    totalCourses: n,
    totalEligibleCourses: n,
    selectedAmount: targetR,
    totalCombinations:
      totalTheoreticalCombinations > 0
        ? totalTheoreticalCombinations
        : allCombinations.length,
    totalValidSchedules: validSchedules.length,
    discardedSchedules: allCombinations.length - validSchedules.length,
    discardedReasons,
    schedules: validSchedules.map((schedule, index) => ({
      scheduleId: index + 1,
      totalCourses: schedule.length,
      totalCredits: schedule.reduce((sum, c) => sum + c.credits, 0),
      courses: schedule,
    })),
  };
};
