import openPubSubClient from ".";

const pubClient = openPubSubClient("ws://localhost:3000");

const subClient = openPubSubClient("ws://localhost:3000");

subClient.on("test", (data: string) => {
  console.log(JSON.parse(data));
});

setInterval(() => {
  pubClient.publish("test", JSON.stringify({ hello: "world" }));
}, 3000);
