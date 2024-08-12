import User from "../models/users.model.js"

export const VisibilityToggle=async(req,res)=>{

    const {userId,visibility} = req.body
    try{
        const ghostToggle = await User.findOneAndUpdate({
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