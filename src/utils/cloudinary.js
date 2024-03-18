import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';
          
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if(!localFilePath) throw new Error("File path is required");
    //upload file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    //file uploaded successfully
    console.log("File uploaded successfully", response.url);
    return response;
  }
  catch (error) {
    //remove file from local directory if it is not uploaded on cloudinary
    fs.unlinkSync(localFilePath);
    return null;
  }
}

export {uploadOnCloudinary}