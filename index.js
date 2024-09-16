import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose';
import locations from './routes/locations.js'
import discordAuth from './routes/discordAuth.js'
import usersRoute from './routes/users.js'
import plannerRoute from './routes/planner.js'
import http from 'http';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { Server } from 'socket.io';

dotenv.config();
const app = express()
const server = http.createServer(app);
app.use(cookieParser());


app.use(cors({
    
        origin: `${process.env.CLIENT_ENDPOINT}`,
        credentials: true,
      },
));

const io = new Server(server,{
    cors: {
        origin: `${process.env.CLIENT_ENDPOINT}`,
        credentials: true,
      },
});

const port = 3000
app.set('socketio', io);
app.use(express.json());


app.use('/api/location',locations)
app.use('/api/auth',discordAuth)
app.use('/api/user',usersRoute)
app.use('/api/planner',plannerRoute)

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