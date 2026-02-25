import { io, Socket } from 'socket.io-client'
import { SOCKET_URL } from '@/utils/constants'

let socket: Socket | null = null

export function connect(token: string): Socket {
  if (socket?.connected) return socket

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket?.id)
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
  })

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message)
  })

  return socket
}

export function disconnect(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export function getSocket(): Socket | null {
  return socket
}
