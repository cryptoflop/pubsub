
export default function openPubSubClient(wsUrl: string) {
  let ws: WebSocket;

  let subs = new Map<string, Array<(payload: unknown) => void>>();

  const que: [string, unknown][] = []

  function send(action: string, payload: unknown) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify([action, payload]));
    } else {
      que.push([action, payload]);
    }
  }

  function replay() {
    while (que.length) {
      const [action, payload] = que.shift()!;
      send(action, payload);
    }
  }

  function handleMessage(data: string) {
    try {
      const [action, payload] = JSON.parse(data);
      switch (action) {
        case "PUB":
          const [topic, data] = payload;
          subs.get(topic)?.forEach(f => f(data));
          break;
      }
    } catch {
      return
    }
  }

  function openWs() {
    const newWs = new WebSocket(wsUrl);
    newWs.onopen = () => replay();
    newWs.onmessage = (e) => handleMessage(e.data);
    newWs.onclose = () => setTimeout(() => (ws = openWs()), 5000);
    return newWs;
  }

  ws = openWs();

  return {
    publish(topic: string, payload: unknown) {
      send("PUB", [topic, payload]);
    },
    on<T>(topic: string, cb: (payload: T) => void) {
      if (!subs.has(topic)) {
        subs.set(topic, []);
        send("SUB", topic);
      }
      subs.get(topic)!.push(() => cb);
      return () => this.off(topic, cb);
    },
    off<T>(topic: string, cb: (payload: T) => void) {
      subs.set(topic, subs.get(topic)?.filter(f => f !== cb) || []);
      if (subs.get(topic)!.length) {
        send("UNSUB", topic);
        subs.delete(topic);
      }
    },
    close() {
      ws.close()
    },
  }
}