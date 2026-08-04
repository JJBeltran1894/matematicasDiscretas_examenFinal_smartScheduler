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


-- 4. INSERCIÓN DE DATOS INICIALES (Datos de prueba para evaluación)
INSERT INTO courses (name, day, start_time, end_time, modality, difficulty, credits) VALUES
('Programación', 'Lunes', '08:00', '10:00', 'Presencial', 'Alta', 4),
('Matemáticas', 'Lunes', '10:00', '12:00', 'Presencial', 'Media', 3),
('Inglés', 'Martes', '08:00', '10:00', 'Virtual', 'Baja', 2),
('Base de datos básica', 'Miércoles', '08:00', '10:00', 'Presencial', 'Media', 3),
('Base de datos avanzada', 'Miércoles', '10:00', '12:00', 'Virtual', 'Alta', 4),
('Redes', 'Jueves', '08:00', '10:00', 'Presencial', 'Alta', 3);

-- Asignar prerrequisito: 'Base de datos avanzada' (ID 5) requiere 'Base de datos básica' (ID 4)
INSERT INTO prerequisites (course_id, prerequisite_course_id) VALUES (5, 4);

-- Materia A: Lunes 08:00 a 10:00
INSERT INTO courses (name, day, start_time, end_time, modality, difficulty, credits) 
VALUES ('Física I', 'Lunes', '08:00:00', '10:00:00', 'Presencial', 'Media', 4);

-- Materia B: Lunes 09:00 a 11:00 (¡SE CRUZA DE 09:00 A 10:00 CON FÍSICA I!)
INSERT INTO courses (name, day, start_time, end_time, modality, difficulty, credits) 
VALUES ('Cálculo II', 'Lunes', '09:00:00', '11:00:00', 'Presencial', 'Alta', 4);

-- Materia C: Requiere Física I (ID de Física I como prerrequisito)
-- (Si Física I termina siendo ID 7, aquí le asignamos ese requisito)