import Location from '../models/location.model.js';


export const createNewLocation =async (req,res)=>{
    const { userId, latitude, longitude } = req.body;

    try {
        let create = await Location.findOneAndUpdate(
          { userId },
          { latitude, longitude, timestamp: new Date() },
          { upsert: true, new: true }
        );
        const io = req.app.get('socketio');
        if (io) {
          io.emit('locationUpdate', { userId, latitude, longitude });
        } else {
          console.error('Socket.io instance is not available');
        }
    
        res.status(200).send('Location updated');
      } catch (error) {
        res.status(500).send('Error updating location');
      }

}

export const getAllLocations= async(req,res)=>{
        try {
          const locations = await Location.find();
          res.json(locations);
        } catch (error) {
          res.status(500).send('Error fetching locations');
        }
      
}