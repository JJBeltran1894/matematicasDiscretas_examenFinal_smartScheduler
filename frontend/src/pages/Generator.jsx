import React, { useState, useEffect } from "react";
import api from "../config/api";

export const GeneratorPage = () => {
  const [courses, setCourses] = useState([]);
  const [completedIds, setCompletedIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [requiredIds, setRequiredIds] = useState([]);

  // CONDICIONES DEL TALLER
  const [numberOfCourses, setNumberOfCourses] = useState(2);
  const [maxCredits, setMaxCredits] = useState(20);
  const [maxDifficultCourses, setMaxDifficultCourses] = useState(2);
  const [preferredModality, setPreferredModality] = useState("Todas");

  const [result, setResult] = useState(null);
  const [currentScheduleIndex, setCurrentScheduleIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get("/courses");
      setCourses(response.data);
    } catch (err) {
      setError("Error al cargar la lista de materias.");
    }
  };

  // 🧹 Al marcar como aprobada, se elimina de deseadas y de obligatorias
  const toggleCompleted = (id) => {
    setCompletedIds((prev) => {
      const isAlreadyCompleted = prev.includes(id);
      if (!isAlreadyCompleted) {
        setSelectedIds((sel) => sel.filter((sId) => sId !== id));
        setRequiredIds((req) => req.filter((rId) => rId !== id));
        return [...prev, id];
      } else {
        return prev.filter((cId) => cId !== id);
      }
    });
  };

  // Para marcar/desmarcar materias deseadas
  const toggleSelected = (id) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) {
        setRequiredIds((req) => req.filter((rId) => rId !== id));
        return prev.filter((sId) => sId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Para marcar/desmarcar materias obligatorias
  const toggleRequired = (id) => {
    setRequiredIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id],
    );
  };

  // Enviar datos al backend
  const handleGenerate = async () => {
    if (selectedIds.length === 0) {
      alert("Por favor selecciona al menos una materia para cursar.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await api.post("/schedules/generate", {
        selectedCourseIds: selectedIds,
        completedCourseIds: completedIds,
        conditions: {
          numberOfCourses: Number(numberOfCourses),
          maxCredits: Number(maxCredits),
          maxDifficultCourses: Number(maxDifficultCourses),
          requiredCourseIds: requiredIds,
          preferredModality,
        },
      });

      setResult(response.data);
      setCurrentScheduleIndex(0);
    } catch (err) {
      setError("Error al generar las combinaciones de horarios.");
    } finally {
      setLoading(false);
    }
  };

  const currentSchedule = result?.schedules[currentScheduleIndex];

  // Nombres reales para la demostración de conjuntos
  const selectedCourseNames = courses
    .filter((c) => selectedIds.includes(c.id))
    .map((c) => c.name);

  const requiredCourseNames = courses
    .filter((c) => requiredIds.includes(c.id))
    .map((c) => c.name);

  // Filtrar de la lista de deseadas las que YA están aprobadas
  const availableToSelect = courses.filter(
    (course) => !completedIds.includes(course.id),
  );

  return (
    <div className="generator-container">
      <h2>Generador de Horarios Inteligente</h2>
      <p className="generator-subtitle">
        Selecciona tus materias aprobadas y las que deseas inscribir este
        semestre.
      </p>

      {/* Parte 1: Selección de materias con filtro dinámico */}
      <div className="selection-grid">
        {/* Lista 1: Materias aprobadas */}
        <div className="selection-box">
          <h3>1. Materias que YA Aprobaste</h3>
          <small>Servirá para validar el cumplimiento de prerrequisitos.</small>

          <div className="checkbox-list">
            {courses.map((course) => {
              const isCompleted = completedIds.includes(course.id);
              return (
                <div
                  key={`comp-${course.id}`}
                  className={`interactive-course-row ${
                    isCompleted ? "active-completed" : ""
                  }`}
                  onClick={() => toggleCompleted(course.id)}
                >
                  <label
                    className="checkbox-item"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => toggleCompleted(course.id)}
                    />
                    <div className="course-row-info">
                      <span className="course-row-title">{course.name}</span>
                      <div className="mini-chips">
                        <span className="chip-mini">{course.credits} Cr</span>
                        <span className="chip-mini">{course.modality}</span>
                      </div>
                    </div>
                  </label>
                  {isCompleted && (
                    <span className="status-badge-approved">✅ Aprobada</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lista 2: Materias a cursar (Las materias aprobadas se DESAPARECEN de aquí) */}
        <div className="selection-box">
          <h3>2. Materias que DESEAS Cursar</h3>
          <small>
            Mostrando {availableToSelect.length} materias disponibles para
            inscripción.
          </small>

          <div className="checkbox-list">
            {availableToSelect.length === 0 ? (
              <p
                style={{
                  color: "#64748b",
                  fontStyle: "italic",
                  padding: "0.5rem",
                }}
              >
                Has marcado todas las materias como aprobadas.
              </p>
            ) : (
              availableToSelect.map((course) => {
                const isSelected = selectedIds.includes(course.id);
                const isRequired = requiredIds.includes(course.id);

                return (
                  <div
                    key={`sel-${course.id}`}
                    className={`interactive-course-row ${
                      isSelected ? "active-selected" : ""
                    }`}
                    onClick={() => toggleSelected(course.id)}
                  >
                    <label
                      className="checkbox-item"
                      style={{ flex: 1 }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelected(course.id)}
                      />
                      <div className="course-row-info">
                        <span className="course-row-title">{course.name}</span>
                        <div className="mini-chips">
                          <span className="chip-mini">{course.day}</span>
                          <span className="chip-mini">
                            {course.startTime}-{course.endTime}
                          </span>
                          <span className="chip-mini">{course.credits} Cr</span>
                        </div>
                      </div>
                    </label>

                    {isSelected && (
                      <label
                        className={`required-toggle-btn ${
                          isRequired ? "is-required" : ""
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRequired(course.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isRequired}
                          onChange={() => toggleRequired(course.id)}
                          style={{ display: "none" }}
                        />
                        📌 {isRequired ? "Obligatoria" : "Opcional"}
                      </label>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Configurar Condiciones y Restricciones */}
      <div className="conditions-card">
        <h3>⚙️ Configurar Condiciones y Restricciones</h3>
        <div className="form-row">
          <div className="form-group">
            <label>Materias por Horario (r):</label>
            <input
              type="number"
              min="1"
              max="10"
              value={numberOfCourses}
              onChange={(e) => setNumberOfCourses(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Máximo de Créditos Permitidos:</label>
            <input
              type="number"
              min="1"
              max="30"
              value={maxCredits}
              onChange={(e) => setMaxCredits(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Máx. Materias Difíciles:</label>
            <input
              type="number"
              min="0"
              max="10"
              value={maxDifficultCourses}
              onChange={(e) => setMaxDifficultCourses(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Modalidad Preferida:</label>
            <select
              value={preferredModality}
              onChange={(e) => setPreferredModality(e.target.value)}
            >
              <option value="Todas">Todas las Modalidades</option>
              <option value="Presencial">Solo Presencial</option>
              <option value="Virtual">Solo Virtual</option>
              <option value="Híbrida">Solo Híbrida</option>
            </select>
          </div>
        </div>
      </div>

      <button
        className="generate-btn"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading
          ? "Procesando Combinatoria..."
          : "🚀 Generar Combinaciones Óptimas"}
      </button>

      {error && <div className="status-error">{error}</div>}

      {/* Parte 2: Resultados y paginador de horarios */}
      {result && (
        <div className="results-container">
          <hr className="divider" />

          {/* Demostración Matemática */}
          <div className="math-proof-card">
            <h3>📐 Fundamento Matemático Aplicado</h3>

            <div className="math-section">
              <h4>🧮 1. Cálculo Combinatorio C(n,r):</h4>
              <p className="math-line">
                Se seleccionaron <strong>n = {result.totalCourses}</strong>{" "}
                materias para armar grupos de{" "}
                <strong>r = {result.selectedAmount}</strong>:
              </p>
              <p className="math-formula">
                C({result.totalCourses}, {result.selectedAmount}) ={" "}
                <strong>
                  {result.totalCombinations} combinaciones posibles en total
                </strong>
              </p>
            </div>

            <div className="math-section">
              <h4>∪ 2. Teoría de Conjuntos (Pertenencia y Subconjuntos):</h4>
              <ul className="math-list">
                <li>
                  <strong>Universo Seleccionado (S ⊆ U):</strong> S = &#123;{" "}
                  {selectedCourseNames.join(", ")} &#125;
                </li>
                <li>
                  <strong>Conjunto Obligatorio (O ⊆ S):</strong> O = &#123;{" "}
                  {requiredCourseNames.length > 0
                    ? requiredCourseNames.join(", ")
                    : "Ninguna"}{" "}
                  &#125;
                </li>
                <li>
                  <strong>Condición de Inclusión:</strong> Cada horario válido H
                  debe cumplir que O ⊆ H (contener las obligatorias) y H ⊆ S.
                </li>
              </ul>
            </div>

            <div className="math-section">
              <h4>∧ 3. Álgebra Proposicional (Regla Evaluada):</h4>
              <p className="math-rule-text">
                Un horario <strong>H</strong> es VÁLIDO únicamente si se cumplen
                todas las condiciones:
                <br />
                <span className="rule-badge">P</span>{" "}
                <strong>
                  [Cumple prerrequisitos obligatorios (Implicación Lógica P →
                  Q)]
                </strong>
                <br />
                <span className="operator-and">AND</span>
                <br />
                <span className="rule-badge">¬C</span>{" "}
                <strong>[No tiene cruces de horario (A ∩ B = ∅)]</strong>
                <br />
                <span className="operator-and">AND</span>
                <br />
                <span className="rule-badge">O</span>{" "}
                <strong>
                  [Incluye todas las materias obligatorias (O ⊆ H)]
                </strong>
                <br />
                <span className="operator-and">AND</span>
                <br />
                <span className="rule-badge">R</span>{" "}
                <strong>[Total de créditos ≤ {maxCredits}]</strong>
                <br />
                <span className="operator-and">AND</span>
                <br />
                <span className="rule-badge">D</span>{" "}
                <strong>[Materias difíciles ≤ {maxDifficultCourses}]</strong>
              </p>

              <div style={{ marginTop: "0.6rem" }}>
                <strong>Equivalencia Lógica Formal:</strong>
                <p className="math-formula">Válido = P ∧ ¬C ∧ O ∧ R ∧ D</p>
              </div>
            </div>
          </div>

          {/* Explicación de Descartes */}
          {result.discardedReasons && result.discardedReasons.length > 0 && (
            <div className="discarded-box">
              <h4>📋 Explicación Transparente de Descarte de Combinaciones</h4>
              <ul>
                {result.discardedReasons.map((reason, idx) => (
                  <li key={`reason-${idx}`}>{reason}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="results-header">
            <div>
              <h3>
                Combinaciones Encontradas:{" "}
                <span>{result.totalValidSchedules}</span>
              </h3>
              <p>
                Materias elegibles que cumplen prerrequisitos:{" "}
                {result.totalCourses}
              </p>
            </div>

            {result.totalValidSchedules > 0 && (
              <div className="pagination-controls">
                <button
                  disabled={currentScheduleIndex === 0}
                  onClick={() => setCurrentScheduleIndex((prev) => prev - 1)}
                  className="page-btn"
                >
                  ◀ Anterior
                </button>
                <span className="page-info">
                  Opción {currentScheduleIndex + 1} de{" "}
                  {result.totalValidSchedules}
                </span>
                <button
                  disabled={
                    currentScheduleIndex === result.totalValidSchedules - 1
                  }
                  onClick={() => setCurrentScheduleIndex((prev) => prev + 1)}
                  className="page-btn"
                >
                  Siguiente ▶
                </button>
              </div>
            )}
          </div>

          {/* Vista de horario seleccionado */}
          {currentSchedule ? (
            <div className="schedule-card">
              <div className="schedule-card-header">
                <h4>Horario Opción #{currentSchedule.scheduleId}</h4>
                <div>
                  <span className="badge-info">
                    📚 {currentSchedule.totalCourses} Materias
                  </span>
                  <span className="badge-info">
                    🏆 {currentSchedule.totalCredits} Créditos Totales
                  </span>
                </div>
              </div>

              <table className="schedule-table">
                <thead>
                  <tr>
                    <th>Materia</th>
                    <th>Día</th>
                    <th>Horario</th>
                    <th>Modalidad</th>
                    <th>Créditos</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSchedule.courses.map((course) => (
                    <tr key={course.id}>
                      <td>
                        <strong>{course.name}</strong>
                      </td>
                      <td>{course.day}</td>
                      <td>
                        {course.startTime} - {course.endTime}
                      </td>
                      <td>{course.modality}</td>
                      <td>{course.credits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="status-error">
              No se encontraron combinaciones válidas bajo las condiciones
              establecidas.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
