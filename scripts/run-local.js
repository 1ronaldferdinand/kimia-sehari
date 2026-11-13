import handler from "../api/cron.js";

const req = {
  headers: process.env.CRON_SECRET
    ? { authorization: `Bearer ${process.env.CRON_SECRET}` }
    : {},
};

const res = {
  statusCode: 200,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(payload) {
    console.log(`[HTTP ${this.statusCode}]`, JSON.stringify(payload, null, 2));
    return this;
  },
};

await handler(req, res);
