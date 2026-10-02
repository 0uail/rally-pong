# Rally Pong

Real-time Pong for two players. Players only need a display name and a room code—no account required.

## Run locally

```bash
npm install
npm start
```

Open `http://localhost:3000`.

## Make it playable worldwide

Deploy this repository to a Node-compatible host such as Render:

1. Create a new **Web Service** from this project.
2. Use the build command `npm install`.
3. Use the start command `npm start`.
4. Deploy and share the generated `https://...onrender.com` URL.

The server already uses the platform-provided `PORT`, serves the client and Socket.IO from the same origin, and keeps lobby state in memory. That is ideal for short-lived two-player rooms. If the service restarts, active rooms disappear and players can simply create a new room.

The included `render.yaml` can also be used as the deployment blueprint.
