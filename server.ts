import { serve } from "bun";

const server = serve({
  async fetch(req, server) {
    if (req.headers.get("connection")?.includes("Upgrade")) {
      const success = server.upgrade(req);
      if (success) return undefined;
    }
    return Response.error();
  },

  websocket: {
    sendPings: false,
    idleTimeout: 0,

    message(ws, msg) {
      try {
        const [action, payload] = JSON.parse(msg as string);

        switch (action) {
          case "PUB":
            ws.publish(payload[0], JSON.stringify(payload))
            break;
          case "SUB":
            ws.subscribe(payload);
            break;
          case "UNSUB":
            ws.unsubscribe(payload);
            break;
        }
      } catch {
        return;
      }
    },
  },
});

console.log("Server started");
process.on("SIGINT", () => {
  console.log("Server shutting down");
  server.stop();
});
