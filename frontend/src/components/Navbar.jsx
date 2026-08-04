import React from "react";

export const Navbar = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">SmartScheduler</div>
      <div className="navbar-buttons">
        <button
          className={`nav-btn ${activeTab === "courses" ? "active" : ""}`}
          onClick={() => setActiveTab("courses")}
        >
          Gestor de Materias
        </button>
        <button
          className={`nav-btn ${activeTab === "generator" ? "active" : ""}`}
          onClick={() => setActiveTab("generator")}
        >
          Generador de Horarios
        </button>
      </div>
    </nav>
  );
};
