-- ==============================================================================
-- Proyecto: Generador Inteligente de Horarios Académicos
-- Motor de Base de Datos: PostgreSQL
-- Propósito: Creación de la estructura inicial de persistencia
-- Por: Juan José Beltrán
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Tabla principal de materias (Conjunto Universal)
-- Almacena la oferta específica de cada materia incluyendo día, horario y modalidad.
-- ------------------------------------------------------------------------------
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    day VARCHAR(20) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    modality VARCHAR(20) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    credits INTEGER NOT NULL
);

-- ------------------------------------------------------------------------------
-- 2. Tabla para la relación de prerrequisitos
-- Representa la implicación lógica: Si se selecciona un curso (course_id), 
-- entonces debe cumplirse su prerrequisito (prerequisite_course_id).
-- ------------------------------------------------------------------------------
CREATE TABLE prerequisites (
    course_id INTEGER NOT NULL,
    prerequisite_course_id INTEGER NOT NULL,
    PRIMARY KEY (course_id, prerequisite_course_id),
    FOREIGN KEY (course_id) REFERENCES courses (id),
    FOREIGN KEY (prerequisite_course_id) REFERENCES courses (id)
);