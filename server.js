import express from 'express';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { randomBytes } from 'node:crypto';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const lobbies = new Map();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));
app.get('*', (_, res) => res.sendFile(process.cwd() + '/public/index.html'));

const code = () => randomBytes(3).toString('hex').toUpperCase();
const cleanName = (name) => String(name || 'Player').trim().slice(0, 18) || 'Player';
const makeLobby = (host, name) => ({ code: code(), host, started: false, players: [{ id: host, name }], state: { left: 50, right: 50, ball: { x: 50, y: 50, vx: 0, vy: 0 }, score: [0, 0] } });

function emitLobby(lobby) { io.to(lobby.code).emit('lobby:update', { code: lobby.code, players: lobby.players, started: lobby.started }); }
function findLobby(socket) { return socket.data.lobbyCode ? lobbies.get(socket.data.lobbyCode) : null; }

io.on('connection', (socket) => {
  socket.on('lobby:create', ({ name }) => {
    const lobby = makeLobby(socket.id, cleanName(name));
    lobbies.set(lobby.code, lobby); socket.join(lobby.code); socket.data.lobbyCode = lobby.code; socket.data.isHost = true;
    socket.emit('lobby:created', { code: lobby.code }); emitLobby(lobby);
  });

  socket.on('lobby:join', ({ name, code: requested }) => {
    const lobby = lobbies.get(String(requested || '').trim().toUpperCase());
    if (!lobby) return socket.emit('lobby:error', 'That room does not exist. Check the code and try again.');
    if (lobby.players.length >= 2) return socket.emit('lobby:error', 'That room is already full.');
    lobby.players.push({ id: socket.id, name: cleanName(name) }); socket.join(lobby.code); socket.data.lobbyCode = lobby.code;
    socket.emit('lobby:joined', { code: lobby.code }); emitLobby(lobby);
  });

  socket.on('game:start', () => { const lobby = findLobby(socket); if (!lobby || !socket.data.isHost || lobby.players.length < 2) return; lobby.started = true; emitLobby(lobby); io.to(lobby.code).emit('game:started'); });
  socket.on('game:paddle', (value) => { const lobby = findLobby(socket); if (!lobby || !lobby.started) return; socket.to(lobby.code).emit('game:paddle', Math.max(8, Math.min(92, Number(value)))); });
  socket.on('game:state', (state) => { const lobby = findLobby(socket); if (!lobby || !socket.data.isHost || !lobby.started) return; lobby.state = state; socket.to(lobby.code).emit('game:state', state); });
  socket.on('game:rematch', () => { const lobby = findLobby(socket); if (!lobby || !socket.data.isHost) return; lobby.state.score = [0, 0]; io.to(lobby.code).emit('game:rematch'); });
  socket.on('disconnect', () => { const lobby = findLobby(socket); if (!lobby) return; lobbies.delete(lobby.code); io.to(lobby.code).emit('lobby:error', 'The other player left the room.'); });
});

httpServer.listen(PORT, () => console.log(`Rally Pong listening on http://localhost:${PORT}`));
