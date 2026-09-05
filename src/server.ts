import express from 'express';
import { createVercelApp } from '../server/src/vercel.js';

void express;

const app = createVercelApp();

export default app;
