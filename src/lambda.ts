// src/lambda.ts
import serverless from 'serverless-http';
import app from './main';

// 将 Koa 应用包装为 Lambda 处理函数
export const handler = serverless(app);
