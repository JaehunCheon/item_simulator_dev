import express from 'express';
import cookieParser from 'cookie-parser';
import UsersRouter from './routes/users.router.js';
import dotEnv from 'dotenv';
import itemRouter from './routes/items.router.js';

dotEnv.config();

const app = express();
const PORT = 3018;



app.use(express.json());
app.use(cookieParser());

app.use('/api', [itemRouter, UsersRouter]);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});