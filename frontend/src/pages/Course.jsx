import React, { useState, useEffect } from "react";
import api from "../config/api";

export const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para modal de Creación / Edición
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null); // null = Crear, objeto = Editar

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

  // Abrir Modal para Crear
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

  // ✏️ Abrir Modal para EDITAR
  const handleOpenEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      day: course.day,
      startTime:
        course.startTime || course.start_time?.substring(11, 16) || "08:00",
      endTime: course.endTime || course.end_time?.substring(11, 16) || "10:00",
      modality: course.modality,
      difficulty: course.difficulty,
      credits: course.credits,
      prerequisiteIds: course.prerequisites || course.prerequisiteIds || [],
    });
    setIsModalOpen(true);
  };

  // Guardar (POST o PUT)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        // PUT /courses/:id
        await api.put(`/courses/${editingCourse.id}`, formData);
      } else {
        // POST /courses
        await api.post("/courses", formData);
      }
      setIsModalOpen(false);
      fetchCourses();
    } catch (err) {
      alert("Error al guardar los cambios de la materia.");
    }
  };

  // Eliminar materia
  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar esta materia?")) return;
    try {
      await api.delete(`/courses/${id}`);
      fetchCourses();
    } catch (err) {
      alert("Error al eliminar la materia.");
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
          {courses.map((course) => (
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
                  ⏰ {course.startTime || course.start_time?.substring(11, 16)}{" "}
                  - {course.endTime || course.end_time?.substring(11, 16)}
                </div>
                <div className="course-info-row">
                  🎯 Dificultad: <strong>{course.difficulty}</strong>
                </div>
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
                  onClick={() => handleDelete(course.id)}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
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
    </div>
  );
};
