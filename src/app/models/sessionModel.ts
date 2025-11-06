const mongoose = require('mongoose');

// Define the session schema
const sessionSchema = new mongoose.Schema({
  userID: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now, // Automatically sets the creation time
  },
});

// Create a TTL index on the 'createdAt' field to expire documents after a certain time
sessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 1200 }); // Expire after 20 minutes

// Create and export the Session model
// const Session = mongoose.model('Session', sessionSchema);
const sessionsModel= mongoose.models.sessions || mongoose.model('sessions', sessionSchema)


export default sessionsModel;
