"use strict";
const amqp = require("amqplib");
const EventEmitter = require("events");
const { v4: uuidv4 } = require("uuid");

// this queue name will be attached to "replyTo" property on producer's message,
// and the consumer will use it to know which queue to the response back to the producer
const REPLY_QUEUE = "amq.rabbitmq.reply-to";

/**
 * Create amqp channel and return back as a promise
 * @params {Object} setting
 * @params {String} setting.url
 * @returns {Promise} - return amqp channel
 */
const createClient = (setting) =>
  amqp
    .connect(setting.url)
    .then((conn) => conn.createChannel()) // create channel
    .then((channel) => {
      channel.responseEmitter = new EventEmitter();
      channel.responseEmitter.setMaxListeners(0);
      channel.consume(
        REPLY_QUEUE,
        (msg) =>
          channel.responseEmitter.emit(
            msg.properties.correlationId,
            msg.content,
            console.log(
              `[ ${new Date()} ] Message received: ${msg.content} corrID: ${
                msg.properties.correlationId
              }`
            )
          ),
        { noAck: true }
      );
      console.log(`[ ${new Date()} ] Server started`);
      return channel;
    });

/**
 * Send RPC message to waiting queue and return promise object when
 * event has been emitted from the "consume" function
 * @params {Object} channel - amqp channel
 * @params {String} message - message to send to consumer
 * @params {String} rpcQueue - name of the queue where message will be sent to
 * @returns {Promise} - return msg that send back from consumer
 */
const sendRPCMessage = (channel, message, rpcQueue) =>
  new Promise((resolve) => {
    // unique random string
    const correlationId = uuidv4();

    console.log(`[ ${new Date()} ] Message sent: ${correlationId}`);

    channel.responseEmitter.once(correlationId, resolve);
    channel.sendToQueue(rpcQueue, Buffer.from(message), {
      correlationId,
      replyTo: REPLY_QUEUE,
    });
  });

module.exports.createClient = createClient;
module.exports.sendRPCMessage = sendRPCMessage;
