// services/uploadExcel.js
import supabase from '../backend/config/supabase';

export async function uploadExcelFile(file, onProgress) {
  // ✅ Just use the original file name — no timestamp
  const filePath = `uploads/${file.name}`;

  try {
    const { data, error } = await supabase
      .storage
      .from('project-files')
      .upload(filePath, file, {
        upsert: false, // overwrite protection — same file name will fail if already exists
        cacheControl: '3600',
        contentType: file.type,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded / progressEvent.total) * 100
          );
          onProgress(progress);
        },
      });

    if (error) {
      throw error;
    }

    const { data: { publicUrl } } = supabase
      .storage
      .from('project-files')
      .getPublicUrl(filePath);

    return {
      success: true,
      path: filePath,
      publicUrl,
      fileName: file.name,
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw new Error(error.message || 'File upload failed');
  }
}
