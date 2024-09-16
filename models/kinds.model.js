import mongoose from 'mongoose';

const kindsSchema = new mongoose.Schema({
    kind: { type: String, required: true},
    selectionCount: { type: Number, default: 0 },
    label: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  });

const Kinds = mongoose.model('Kinds', kindsSchema);

export default Kinds