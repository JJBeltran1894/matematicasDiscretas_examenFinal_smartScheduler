import React, { useState } from "react";
import api from "../config/api";

export const CourseForm = ({ courses, onCourseCreated }) => {
  const [formData, setFormData] = useState({
    name: "",
    day: "Lunes",
    startTime: "08:00",
    endTime: "10:00",
    modality: "Presencial",
    difficulty: "Media",
    credits: 3,
    prerequisiteIds: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePrerequisiteToggle = (id) => {
    setFormData((prev) => {
      const exists = prev.prerequisiteIds.includes(id);
      return {
        ...prev,
        prerequisiteIds: exists
          ? prev.prerequisiteIds.filter((pId) => pId !== id)
          : [...prev.prerequisiteIds, id],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Ajuste de horas para compatibilidad con el tipo TIME de PostgreSQL
      const payload = {
        name: formData.name,
        day: formData.day,
        start_time: `1970-01-01T${formData.startTime}:00.000Z`,
        end_time: `1970-01-01T${formData.endTime}:00.000Z`,
        modality: formData.modality,
        difficulty: formData.difficulty,
        credits: Number(formData.credits),
        prerequisite_ids: formData.prerequisiteIds,
      };

      await api.post("/courses", payload);

      // Limpiar formulario y recargar lista
      setFormData({
        name: "",
        day: "Lunes",
        startTime: "08:00",
        endTime: "10:00",
        modality: "Presencial",
        difficulty: "Media",
        credits: 3,
        prerequisiteIds: [],
      });
      onCourseCreated();
    } catch (err) {
      setError("Error al registrar la materia. Revisa los datos ingresados.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-card">
      <h3>Registrar Nueva Materia</h3>
      {error && <div className="status-error">{error}</div>}

      <form onSubmit={handleSubmit} className="course-form">
        <div className="form-group">
          <label>Nombre de la Materia:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ej: Cálculo III"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Día de Clase:</label>
            <select name="day" value={formData.day} onChange={handleChange}>
              <option value="Lunes">Lunes</option>
              <option value="Martes">Martes</option>
              <option value="Miércoles">Miércoles</option>
              <option value="Jueves">Jueves</option>
              <option value="Viernes">Viernes</option>
              <option value="Sábado">Sábado</option>
            </select>
          </div>

          <div className="form-group">
            <label>Hora Inicio:</label>
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Hora Fin:</label>
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Modalidad:</label>
            <select
              name="modality"
              value={formData.modality}
              onChange={handleChange}
            >
              <option value="Presencial">Presencial</option>
              <option value="Virtual">Virtual</option>
              <option value="Híbrida">Híbrida</option>
            </select>
          </div>

          <div className="form-group">
            <label>Dificultad:</label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
            >
              <option value="Baja">Baja</option>
              <option value="Media">Media</option>
              <option value="Alta">Alta</option>
            </select>
          </div>

          <div className="form-group">
            <label>Créditos:</label>
            <input
              type="number"
              name="credits"
              min="1"
              max="10"
              value={formData.credits}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Selección de Prerrequisitos */}
        <div className="form-group">
          <label>Prerrequisitos Requeridos (Opcional):</label>
          <div className="prereq-checkbox-grid">
            {courses.length === 0 ? (
              <small>
                No hay materias disponibles para asignar como prerrequisito.
              </small>
            ) : (
              courses.map((c) => (
                <label key={`prereq-option-${c.id}`} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={formData.prerequisiteIds.includes(c.id)}
                    onChange={() => handlePrerequisiteToggle(c.id)}
                  />
                  <span>{c.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
          {loading ? "Guardando..." : "Guardar Materia"}
        </button>
      </form>
    </div>
  );
};
