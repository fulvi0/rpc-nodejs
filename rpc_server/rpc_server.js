"use strict";
require("dotenv").config();
const amqp = require("amqplib");

const q = "rpc_queue";

const amqpURI = `amqp://${process.env.AMQP_USER}:${process.env.AMQP_PASS}@${process.env.AMQP_HOST}:${process.env.AMQP_PORT}/${process.env.AMQP_VHOST}`;
console.log(amqpURI);

amqp
  .connect(amqpURI)
  .then((conn) => {
    return conn.createChannel();
  })
  .then((ch) => {
    ch.assertQueue(q, { durable: false });
    ch.prefetch(1);
    console.log(" [x] Awaiting RPC Requests");
    ch.consume(q, (msg) => {
      const n = parseInt(msg.content.toString());

      console.log(
        `[ ${new Date()} ] Message received: ${n}`
      );

      // start
      let tStart = Date.now();

      let r = fibonacci(n);

      // finish
      let tEnd = Date.now();

      // to send object as a message,
      // you have to call JSON.stringify
      r = JSON.stringify({
        result: r,
        time: tEnd - tStart,
      });

      ch.sendToQueue(msg.properties.replyTo, Buffer.from(r.toString()), {
        correlationId: msg.properties.correlationId,
      });
          console.log(
            `[ ${new Date()} ] Message sent: ${msg.properties.correlationId}`);
      ch.ack(msg);
    });
  });

function fibonacci(n) {
  if (!n) n = 1;

  if (n === 0 || n === 1) return n;
  else return fibonacci(n - 1) + fibonacci(n - 2);
}
