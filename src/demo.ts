// src/main.ts
import dotenv from 'dotenv';
import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import { OpenAIService } from './services/openai.service';
dotenv.config();

const app = new Koa();
const router = new Router();
const port = 3000;

// 创建 OpenAIService 实例
const OPENAI_API_KEY = `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`;
const openAIService = new OpenAIService(process.env.OPENAI_API_KEY || OPENAI_API_KEY);

// 中间件
app.use(cors());
app.use(bodyParser());

// API 路由
router.post('/query', async (ctx) => {
	try {
		const { input } = ctx.request.body as { input: string };
		if (!input) {
			ctx.status = 400;
			ctx.body = { error: '请提供问题内容' };
			return;
		}

		const result = await openAIService.query(input);
		ctx.body = { response: result };
	} catch (error) {
		ctx.status = 500;
		ctx.body = {
			error: '服务器错误',
			message: error instanceof Error ? error.message : '未知错误',
		};
	}
});

// 错误处理
app.on('error', (err, ctx) => {
	console.error('服务器错误:', err);
});

// 使用路由
app.use(router.routes()).use(router.allowedMethods());

// 启动服务器
app.listen(port, () => {
	console.log(`服务器运行在 http://localhost:${port}`);
});
