import { NextResponse } from 'next/server'
import { createAuthHandler } from '@/shared/middlewares/auth'
import { ALL_ROLES } from '@/shared/middlewares/roleGuard'

// Singleton in-memory persistent store to avoid clearing in HMR/dev reloading
const globalForChat = global as unknown as {
  chats: Record<string, any[]>
};

const chats = globalForChat.chats || {};
if (process.env.NODE_ENV !== "production") globalForChat.chats = chats;

export const GET = createAuthHandler(
  async (request) => {
    try {
      const { searchParams } = new URL(request.url);
      const farmerId = searchParams.get('farmerId');

      if (!farmerId) {
        return NextResponse.json(
          { error: 'farmerId es requerido' },
          { status: 400 }
        );
      }

      const history = chats[farmerId] || [];
      return NextResponse.json(history);
    } catch (error: any) {
      console.error("[Chat API GET Error]:", error);
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
  },
  ALL_ROLES
);

export const POST = createAuthHandler(
  async (request) => {
    try {
      const body = await request.json();
      const { farmerId, sender, text } = body;

      if (!farmerId || !sender || !text) {
        return NextResponse.json(
          { error: 'farmerId, sender y text son requeridos' },
          { status: 400 }
        );
      }

      if (!chats[farmerId]) {
        chats[farmerId] = [];
      }

      const newMessage = {
        id: crypto.randomUUID(),
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      chats[farmerId].push(newMessage);
      globalForChat.chats = chats; // Sync to global singleton

      return NextResponse.json(newMessage, { status: 201 });
    } catch (error: any) {
      console.error("[Chat API POST Error]:", error);
      return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
  },
  ALL_ROLES
);
