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
const port = 3000; // Use for local debugging

// Create AgentService instance
const agentService = new AgentService({
	openAIApiKey: process.env.OPENAI_API_KEY || '',
	etherscanApiKey: 'NSZCD6S4TKVWRS13PMQFMVTNP6H7NAGHUY',
	rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
});
// Initialize agents
agentService.initialize().catch(console.error);

// Middleware
app.use(cors());
app.use(bodyParser());

// API routes
router.post('/query', async (ctx) => {
	try {
		const { input } = ctx.request.body as { input: string };
		if (!input) {
			ctx.status = 400;
			ctx.body = { error: 'Please provide a question' };
			return;
		}

		const result = await agentService.query(input);
		ctx.body = result;
	} catch (error) {
		ctx.status = 500;
		ctx.body = {
			error: 'Server error',
			message: error instanceof Error ? error.message : 'Unknown error',
		};
	}
});

router.get('/test', async (ctx) => {
	ctx.body = {
		data: 'Hello Aladdin',
	};
});
// Error handling
app.on('error', (err, ctx) => {
	console.error('Server error:', err);
});

// Use routes
app.use(router.routes()).use(router.allowedMethods());

// Start server locally (only for local debugging, can be commented out when deploying to Lambda)
if (process.env.NODE_ENV === 'development') {
	app.listen(port, () => {
		console.log(`Server running at http://localhost:${port}`);
	});
}

// Export app instance for Lambda usage
export default app;
