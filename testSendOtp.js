import handler from './api/sendotp.js';
import dotenv from 'dotenv';
dotenv.config();

const req = {
  method: 'POST',
  body: { email: 'moviemagic1911@gmail.com' }
};

const res = {
  status: function(s) { this.statusCode = s; return this; },
  json: function(j) { this.body = j; console.log('Status:', this.statusCode, 'Body:', j); return this; }
};

handler(req, res).catch(console.error);
