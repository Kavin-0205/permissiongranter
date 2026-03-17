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

  const uris = [
    process.env.MONGO_URI,
    process.env.MONGO_FALLBACK_URI,
    'mongodb://127.0.0.1:27017/helleyx',
  ].filter(Boolean);

  // If SRV DNS is blocked/misconfigured on the network, forcing resolvers can help.
  // Set via env: DNS_SERVERS=8.8.8.8,1.1.1.1
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

  for (const uri of uris) {
    try {
      console.log('Trying MongoDB URI:', maskMongoUri(uri));
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log('MongoDB Connected:', conn.connection.host);
      return;
    } catch (error) {
      console.error('MongoDB connection attempt failed for URI:', maskMongoUri(uri));
      console.error(error?.message || error);
    }
  }

  console.error('All MongoDB connection attempts failed. Server will continue running without DB.');
};

export default connectDB;
