import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import beans from './routes/Beans.route';

dotenv.config();

const app = express();
const port = process.env.PORT;

let corsOptions = {
  origin: ['http://localhost:8000'],
};

app.use(express.json());
app.use(cors(corsOptions));
app.use('/beans', beans);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
  console.log('hello');
});
