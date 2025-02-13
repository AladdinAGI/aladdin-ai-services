// src/lambda.ts
import serverless from 'serverless-http';
import app from './main';

// Wrap Koa app in Lambda handler function
export const handler = serverless(app);
