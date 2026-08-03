import express from "express";
import cors from "cors";
import "./database/prisma.ts";

const app = express();
const PORT = 3001;

app.use(cors());

app.use(express.json());

app.listen(PORT, () => {
  console.log("SERVIDOR LEVANTADO EN EL PUERTO ", PORT);
});
