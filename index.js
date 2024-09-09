import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import pagesRouter from './routes/pageRoutes/controller.js';
import authRouter from './routes/authRoutes/controller.js';
import purchaseRouter from './routes/purchaseRoutes/controller.js';

// initializing express
const app = express();

// configure environment variable
dotenv.config();

// calling environment variables
const port = process.env.PORT || 8080;
const dburi = process.env.dbURI;

// connect mongoose and initialize express listen
mongoose
  .connect(dburi, { useNewUrlParser: true, useUnifiedTopology: true })
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
    origin: true, // Reflects the origin of the request
  })
);

// use the router
app.use('/api', authRouter);
app.use('/api', pagesRouter);
app.use('/api', purchaseRouter);

// Serve static files from the 'dist' directory
app.use(express.static('dist'));

// Handle client-side routing, return index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve('dist', 'index.html'));
});

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

export default app;
