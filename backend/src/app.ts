import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ENV } from './config/env';
import { errorHandler } from './middleware/error';
import { extractApiKeys } from './middleware/apikey';
import authRoutes from './routes/auth';
import itineraryRoutes from './routes/itinerary';
import locationRoutes from './routes/location';
import testRoutes from './routes/test';
import configRoutes from './routes/config';

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use(extractApiKeys);

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/itinerary', itineraryRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/test', testRoutes);
app.use('/api/config', configRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// 启动服务器
const PORT = ENV.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🌍 Environment: ${ENV.NODE_ENV}`);
});

export default app;

