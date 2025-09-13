import { VercelRequest, VercelResponse } from '@vercel/node';
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { env } from "../src/config/env";
import networkRoutes from "../src/routes/network.routes";
import postsRoutes from "../src/routes/posts.routes";
import mediaRoutes from "../src/routes/media.routes";
import commentsRoutes from "../src/routes/comments.routes";

let app: any = null;

async function buildServer() {
  if (app) return app;
  
  const fastify = Fastify({ 
    logger: process.env.NODE_ENV === 'development',
    trustProxy: true 
  });

  await fastify.register(cors, {
    origin: [
      "http://localhost:3000", 
      "http://127.0.0.1:3000", 
      "https://nexus-frontend-pi-ten.vercel.app",
      /\.vercel\.app$/
    ],
    credentials: true,
    allowedHeaders: ["Authorization", "Content-Type"],
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5
    }
  });

  fastify.get("/", async () => ({ message: "Nexus Network Service 🌐" }));
  fastify.get("/health", async () => ({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    service: "network"
  }));

  await fastify.register(networkRoutes);
  await fastify.register(postsRoutes);
  await fastify.register(mediaRoutes);
  await fastify.register(commentsRoutes);

  app = fastify;
  return fastify;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const server = await buildServer();
    await server.ready();
    server.server.emit('request', req, res);
  } catch (error) {
    console.error('Network service error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}
