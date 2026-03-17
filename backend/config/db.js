import mongoose from 'mongoose';
import dns from 'node:dns';

function maskMongoUri(uri) {
  if (!uri) return uri;
  // Mask credentials: mongodb(+srv)://user:pass@host -> mongodb(+srv)://user:***@host
  return uri.replace(/(mongodb(?:\+srv)?:\/\/[^/:]+:)([^@]+)(@)/i, '$1***$3');
}

const connectDB = async () => {
  // Fail fast instead of buffering queries for 10s+ when disconnected.
  mongoose.set('bufferCommands', false);

  const isProduction = process.env.NODE_ENV === 'production';
  // Use local DB for dev if available, otherwise fallback to primary MONGO_URI then local default
  const mongoUri = isProduction 
    ? process.env.MONGO_URI 
    : (process.env.MONGO_LOCAL_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/helleyx');

  if (!mongoUri) {
    console.error('MongoDB URI is missing. Set MONGO_URI in .env');
    process.exit(1);
  }

  // If SRV DNS is blocked/misconfigured on the network, forcing resolvers can help.
  const dnsServers = (process.env.DNS_SERVERS || '8.8.8.8,1.1.1.1')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  if (dnsServers.length) {
    try {
      dns.setServers(dnsServers);
      console.log('Using DNS servers for Mongo SRV:', dnsServers.join(', '));
    } catch (e) {
      console.warn('Failed to set custom DNS servers:', e?.message || e);
    }
  }

  try {
    console.log(`Connecting to MongoDB (${isProduction ? 'Production' : 'Development'})...`);
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
