import supabase from '../backend/config/supabase';

export async function uploadExcelFile(file, plantId, onProgress) {
  try {
    console.log('[Upload] Starting upload for plantId:', plantId);
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    console.log('[Upload] Attempting storage upload to:', filePath);
    
    // 1. First upload to storage
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('project-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
        onUploadProgress: (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100);
          onProgress(percent);
        }
      });

    if (storageError) {
      console.error('[Upload] Storage error:', storageError);
      throw storageError;
    }

    console.log('[Upload] Storage upload successful, now saving to plant_files');

    // 2. Then save metadata to database
    const { data: dbData, error: dbError } = await supabase
      .from('plant_files')
      .insert({
        plant_id: plantId,
        original_filename: file.name,
        storage_path: filePath
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Upload] Database error:', dbError);
      throw dbError;
    }

    console.log('[Upload] Database insert successful:', dbData);

    return {
      success: true,
      filePath,
      originalFilename: file.name,
      dbRecord: dbData
    };
  } catch (error) {
    console.error('[Upload] Full error:', error);
    throw error;
  }
}