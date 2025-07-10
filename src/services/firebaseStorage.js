import { storage } from './storage';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const uploadFile = async (file, businessName, plantName) => {
  try {
    // Create a unique file path
    const filePath = `uploads/${businessName}/${plantName}/${Date.now()}_${file.name}`;
    const storageRef = ref(storage, filePath);
    
    // Upload the file
    await uploadBytes(storageRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    return {
      url: downloadURL,
      path: filePath
    };
  } catch (error) {
    console.error("Error uploading file: ", error);
    throw error;
  }
};

export const getFileUrl = async (filePath) => {
  try {
    const storageRef = ref(storage, filePath);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error getting file URL: ", error);
    throw error;
  }
};