import supabase from '../backend/config/supabase';

export const saveData = async (formData) => {
  try {
    const businessName = formData.get('businessName');
    const plantName = formData.get('plantName');
    const date = new Date().toISOString();

    // Upsert business
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .upsert({ name: businessName }, { onConflict: 'name' })
      .select()
      .single();

    if (businessError) throw businessError;

    // Upsert plant
    const { data: plant, error: plantError } = await supabase
      .from('plants')
      .upsert({ 
        business_id: business.id, 
        name: plantName 
      }, { onConflict: 'business_id,name' })
      .select()
      .single();

    if (plantError) throw plantError;

    // Prepare emissions data
    const emissionsData = { 
      plant_id: plant.id, 
      date,   // Default target year
    };
    
    for (let year = 2025; year <= 2030; year++) {
      emissionsData[`scope1_${year}`] = Number(formData.get(`scope1_${year}`)) || 0;
      emissionsData[`scope2_${year}`] = Number(formData.get(`scope2_${year}`)) || 0;
    }

    // Save emissions data
    const { error: emissionsError } = await supabase
      .from('emissions')
      .upsert(emissionsData, { onConflict: 'plant_id,date' });

    if (emissionsError) throw emissionsError;

    return { success: true };
  } catch (error) {
    console.error('Save error:', error);
    return { success: false, error: error.message };
  }
};

export const uploadExcelFile = async (file, progressCallback) => {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `uploads/${fileName}`;

    const { data, error } = await supabase
      .storage
      .from('project-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
        onUploadProgress: (progress) => {
          const progressPercent = (progress.loaded / progress.total) * 100;
          progressCallback(progressPercent);
        }
      });

    if (error) throw error;
    return { success: true, filePath };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};