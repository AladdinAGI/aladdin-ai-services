// src/main.ts
import dotenv from 'dotenv';
import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import { AgentService } from './services/agent.service';

dotenv.config();

const app = new Koa();
const router = new Router();
const port = 3000;

// 创建 AgentService 实例
const agentService = new AgentService(process.env.OPENAI_API_KEY || '');

// 初始化 agents
agentService.initialize().catch(console.error);

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

		const result = await agentService.query(input);
		ctx.body = result;
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
