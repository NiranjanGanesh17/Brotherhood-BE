import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv'


dotenv.config();
cloudinary.config({ 
    cloud_name: 'dao9osuwj', 
    api_key: '557818837274414', 
    api_secret: `${process.env.CLOUDINARY_KEY}` 
});

export default cloudinary;
