import express from 'express';
import signup from './signup.js';
import signin from './signin.js';

const authRouter = express.Router();

// Define the signup route
authRouter.post('/signup', signup);

// Define the signin route
authRouter.post('/signin', signin);

export default authRouter;
