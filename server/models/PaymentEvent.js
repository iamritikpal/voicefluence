const mongoose = require('mongoose');

const paymentEventSchema = new mongoose.Schema({
  webhookId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  userId: { type: String, default: '' },
  plan: { type: String, default: '' },
  type: { type: String, default: '' },
  rawPayload: { type: Object, default: {} },
  processedAt: { type: Date, default: Date.now },
});

paymentEventSchema.index({ webhookId: 1 });

module.exports = mongoose.model('PaymentEvent', paymentEventSchema);
