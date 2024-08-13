import Location from '../models/location.model.js';


export const createNewLocation =async (req,res)=>{
    const { userId, latitude, longitude } = req.body;

    try {
        let create = await Location.findOneAndUpdate(
          { userId },
          { latitude, longitude, timestamp: new Date() },
          { upsert: true }
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

export const LocationVisibilityToggle=async(req,res)=>{

    const {userId,visibility} = req.body
    try{
        const ghostToggle = await Location.findOneAndUpdate({
            userId
        },{
            visibility
        })
        const io = req.app.get('socketio');
            if (io) {
              io.emit('visibilityUpdated', {
                userId,
                visibility,
              });
            } else {
              console.error('Socket.io instance is not available');
            }

            res.status(200).json(ghostToggle);

    }
    catch (error) {
        console.error('Error updating visibility:', error);
        res.status(500).json({ message: 'Internal server error' });
      }



}


export const getAllLocations= async(req,res)=>{
        try {
        //   const locations = await Location.find();
        const locations = await Location.aggregate([
            {
              $lookup: {
                from: 'users', 
                localField: 'userId', 
                foreignField: 'userId', 
                as: 'userInfo', 
              },
            },
            {
              $unwind: '$userInfo',
            },
            {
              $project: {
                _id: 1,
                userId: 1, 
                latitude: 1, 
                longitude: 1, 
                timestamp: 1,
                visibility: 1, 
                avatar: '$userInfo.avatar', 
                userName: '$userInfo.globalName',
              },
            },
          ]);
          res.status(200).json(locations);
        } catch (error) {
          res.status(500).send('Error fetching locations');
        }
      
}