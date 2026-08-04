import React, { useState } from "react";
import { Navbar } from "./components/Navbar";
import { CoursesPage } from "./pages/Course";
import { GeneratorPage } from "./pages/Generator";

function App() {
  const [activeTab, setActiveTab] = useState("courses");

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {activeTab === "courses" && <CoursesPage />}
      {activeTab === "generator" && <GeneratorPage />}
    </div>
  );
}

export default App;
