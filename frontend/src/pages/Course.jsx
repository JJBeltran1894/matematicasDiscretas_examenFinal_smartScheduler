import React, { useState, useEffect } from "react";
import api from "../config/api";

export const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para las notificaciones Toast
  const [toast, setToast] = useState(null);

  // Estados para modal de Creación / Edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // Estado para el Modal de Confirmación de Eliminación
  const [courseToDelete, setCourseToDelete] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    day: "Lunes",
    startTime: "08:00",
    endTime: "10:00",
    modality: "Presencial",
    difficulty: "Alta",
    credits: 3,
    prerequisiteIds: [],
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const showToast = (message, type) => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await api.get("/courses");
      setCourses(response.data);
    } catch (err) {
      setError("Error al obtener la lista de materias.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setEditingCourse(null);
    setFormData({
      name: "",
      day: "Lunes",
      startTime: "08:00",
      endTime: "10:00",
      modality: "Presencial",
      difficulty: "Alta",
      credits: 3,
      prerequisiteIds: [],
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (course) => {
    setEditingCourse(course);

    const prereqIds = (
      course.prerequisites ||
      course.prerequisiteIds ||
      []
    ).map((p) => (typeof p === "object" ? Number(p.id) : Number(p)));

    setFormData({
      name: course.name || "",
      day: course.day || "Lunes",
      startTime:
        course.startTime || course.start_time?.substring(11, 16) || "08:00",
      endTime: course.endTime || course.end_time?.substring(11, 16) || "10:00",
      modality: course.modality || "Presencial",
      difficulty: course.difficulty || "Alta",
      credits: Number(course.credits) || 3,
      prerequisiteIds: prereqIds,
    });
    setIsModalOpen(true);
  };

  const togglePrerequisite = (id) => {
    const targetId = Number(id);
    setFormData((prev) => {
      const exists = prev.prerequisiteIds.some(
        (pId) => Number(pId) === targetId,
      );
      return {
        ...prev,
        prerequisiteIds: exists
          ? prev.prerequisiteIds.filter((pId) => Number(pId) !== targetId)
          : [...prev.prerequisiteIds, targetId],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const cleanPrereqs = formData.prerequisiteIds.map(Number);
      const payload = {
        ...formData,
        credits: Number(formData.credits),
        start_time: formData.startTime,
        end_time: formData.endTime,
        prerequisites: cleanPrereqs,
        prerequisiteIds: cleanPrereqs,
      };

      if (editingCourse) {
        await api.put(`/courses/${editingCourse.id}`, payload);
        showToast(
          `✅ Materia "${formData.name}" actualizada con éxito`,
          "edit",
        );
      } else {
        await api.post("/courses", payload);
        showToast(`✨ Materia "${formData.name}" guardada con éxito`, "create");
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (err) {
      console.error("Error al guardar materia:", err);
      showToast(
        err.response?.data?.message ||
          "Error al guardar los cambios de la materia.",
        "delete",
      );
    }
  };

  // Solicitar confirmación con Modal Personalizado
  const handleRequestDelete = (course) => {
    setCourseToDelete(course);
  };

  // Ejecutar eliminación confirmada
  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    const { id, name } = courseToDelete;
    setCourseToDelete(null);

    try {
      const res = await api.delete(`/courses/${id}`);
      if (res.data) {
        showToast(`🗑️ Materia "${name}" eliminada correctamente`, "delete");
        fetchCourses();
      } else {
        showToast("Error al eliminar la materia.", "delete");
      }
    } catch (err) {
      showToast("Error al eliminar la materia.", "delete");
    }
  };

  return (
    <div className="courses-container">
      <div className="courses-header">
        <div>
          <h2>📚 Catálogo de Materias Registradas</h2>
          <p>
            Conjunto Universal de Oferta Académica Disponible ({courses.length}{" "}
            Materias)
          </p>
        </div>
        <button className="btn-add" onClick={handleOpenCreateModal}>
          Nueva Materia
        </button>
      </div>

      {loading ? (
        <p>Cargando materias...</p>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => {
            const prereqList = course.prerequisites || [];
            return (
              <div key={course.id} className="course-card">
                <div>
                  <div className="course-badges">
                    <span
                      className={`badge badge-${
                        course.modality?.toLowerCase() || "presencial"
                      }`}
                    >
                      {course.modality}
                    </span>
                    <span className="badge badge-credits">
                      {course.credits} Créditos
                    </span>
                  </div>
                  <h3 className="course-title">{course.name}</h3>
                </div>

                <div className="course-card-body">
                  <div className="course-info-row">
                    📅 <strong>{course.day}</strong>
                  </div>
                  <div className="course-info-row">
                    ⏰{" "}
                    {course.startTime || course.start_time?.substring(11, 16)} -{" "}
                    {course.endTime || course.end_time?.substring(11, 16)}
                  </div>
                  <div className="course-info-row">
                    🎯 Dificultad: <strong>{course.difficulty}</strong>
                  </div>
                  {prereqList.length > 0 && (
                    <div
                      className="course-info-row"
                      style={{ fontSize: "0.8rem", color: "var(--neon-amber)" }}
                    >
                      📌 Prerrequisitos: {prereqList.length} materia(s)
                    </div>
                  )}
                </div>

                <div className="course-card-actions">
                  <button
                    className="btn-edit"
                    onClick={() => handleOpenEditModal(course)}
                  >
                    Editar
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleRequestDelete(course)}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCourse ? "Editar Materia" : "Nueva Materia"}</h3>
              <button
                className="close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                ✖
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Nombre de la Materia:</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Día:</label>
                  <select
                    value={formData.day}
                    onChange={(e) =>
                      setFormData({ ...formData, day: e.target.value })
                    }
                  >
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                    <option value="Sábado">Sábado</option>
                    <option value="Domingo">Domingo</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Créditos:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.credits}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        credits: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hora Inicio:</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) =>
                      setFormData({ ...formData, startTime: e.target.value })
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Hora Fin:</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) =>
                      setFormData({ ...formData, endTime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Modalidad:</label>
                  <select
                    value={formData.modality}
                    onChange={(e) =>
                      setFormData({ ...formData, modality: e.target.value })
                    }
                  >
                    <option value="Presencial">Presencial</option>
                    <option value="Virtual">Virtual</option>
                    <option value="Híbrida">Híbrida</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Dificultad:</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) =>
                      setFormData({ ...formData, difficulty: e.target.value })
                    }
                  >
                    <option value="Baja">Baja</option>
                    <option value="Media">Media</option>
                    <option value="Alta">Alta</option>
                  </select>
                </div>
              </div>

              {/* Selector de Prerrequisitos */}
              <div className="form-group">
                <label>Prerrequisitos (Materias requeridas):</label>
                <div className="prereq-checkbox-list">
                  {courses
                    .filter(
                      (c) =>
                        !editingCourse ||
                        Number(c.id) !== Number(editingCourse.id),
                    )
                    .map((course) => {
                      const isChecked = formData.prerequisiteIds.some(
                        (pId) => Number(pId) === Number(course.id),
                      );
                      return (
                        <label
                          key={`prereq-${course.id}`}
                          className="checkbox-item-modal"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePrerequisite(course.id)}
                          />
                          <span>{course.name}</span>
                        </label>
                      );
                    })}
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingCourse ? "Guardar Cambios" : "Crear Materia"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PERSONALIZADO DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {courseToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "420px" }}>
            <div className="modal-header">
              <h3>🗑️ Confirmar Eliminación</h3>
              <button
                className="close-btn"
                onClick={() => setCourseToDelete(null)}
              >
                ✖
              </button>
            </div>
            <p style={{ color: "var(--text-secondary)", margin: "1rem 0" }}>
              ¿Estás seguro de que deseas eliminar la materia{" "}
              <strong style={{ color: "var(--text-primary)" }}>
                "{courseToDelete.name}"
              </strong>
              ? Esta acción no se puede deshacer.
            </p>
            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setCourseToDelete(null)}
              >
                Cancelar
              </button>
              <button
                className="btn-delete"
                style={{
                  flex: "none",
                  width: "auto",
                  padding: "0.6rem 1.2rem",
                }}
                onClick={handleConfirmDelete}
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MENSAJE FLOTANTE DE CONFIRMACIÓN (TOAST INFERIOR DERECHO) */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};
