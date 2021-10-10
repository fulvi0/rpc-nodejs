"use strict";
require("dotenv").config();
const express = require("express");
const app = express();

const amqpClient = require("./amqpClient");

const amqpURI = `amqp://${process.env.AMQP_USER}:${process.env.AMQP_PASS}@${process.env.AMQP_HOST}:${process.env.AMQP_PORT}/${process.env.AMQP_VHOST}`;
console.log(amqpURI);

let channel;
amqpClient
  .createClient({
    url: amqpURI,
  })
  .then((ch) => {
    // channel is kept for later use
    channel = ch;
  });

app.get("/fibonacci/:number", function (req, res) {
  const number = req.params.number;
  amqpClient.sendRPCMessage(channel, number, "rpc_queue").then((msg) => {
    const result = JSON.parse(msg.toString());
    res.json(result);
  });
});

const server = require("http").createServer(app);
server.listen(process.env.PORT, function () {
  console.log("App started.");
});
