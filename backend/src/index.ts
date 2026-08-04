import express from "express";
import cors from "cors";
import "./database/prisma.ts";
import courseRouter from "./routes/course.routes.ts";
import scheduleRouter from "./routes/schedule.routes.ts";

const app = express();
const PORT = 3001;

app.use(cors());

app.use(express.json());

app.use("/api/courses", courseRouter);
app.use("/api/schedules", scheduleRouter);

app.listen(PORT, () => {
  console.log("SERVIDOR LEVANTADO EN EL PUERTO ", PORT);
});
