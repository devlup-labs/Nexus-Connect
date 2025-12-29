import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
const _dirname = path.resolve();

const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => {  //DO NOT REMOVE THIS ENDPOINT
  res.status(200).json({ msg: "api is up and running" });
});

//This is for deploying the frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(_dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(_dirname, '../frontend/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});