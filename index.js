import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose';
import locations from './routes/locations.js'
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

dotenv.config();
const app = express()
const server = http.createServer(app);
const io = new Server(server,{
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
});

app.use(cors());
const port = 3001
app.set('socketio', io);
app.use(express.json());
app.use('/api/location',locations)
app.get('/', (req, res) => {
    res.send('Hello World!');
  });

io.on('connection',(socket)=>{
    console.log('A user connected');
    socket.on('disconnect', () => {
        console.log('User disconnected');
      });

      socket.on('updateLocation', (data) => {
        io.emit('locationUpdated', data);
      });
})


mongoose.connect(process.env.DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => console.log('MongoDB connected'))
    .catch((err) => console.error('MongoDB connection error:', err));

server.listen(port,()=>{
console.log(`server is listening at port ${port}`)
})