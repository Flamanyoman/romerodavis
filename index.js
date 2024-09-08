import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import pagesRouter from './routes/pageRoutes/controller.js';
import authRouter from './routes/authRoutes/controller.js';
import purchaseRouter from './routes/purchaseRoutes/controller.js';
import cors from 'cors';

// initializing express
const app = express();

// configure environment variable
dotenv.config();

// calling environment variables
const port = process.env.PORT || 8080;
const dburi = process.env.dbURI;

// connect mongoose and initialize express listen
mongoose
  .connect(dburi)
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
      console.log('DB connected as well');
    });
  })
  .catch((err) => console.log(err));

// middleware
app.use(express.json());

// Use CORS middleware
app.use(
  cors({
    origin: 'http://localhost:5173',
  })
);

// use the router
app.use('/api', authRouter);
app.use('/api', pagesRouter);
app.use('/api', purchaseRouter);

// error handler middleware
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Something went wrong';
  return res.status(status).json({
    success: false,
    status,
    message,
  });
};

app.use(errorHandler);
