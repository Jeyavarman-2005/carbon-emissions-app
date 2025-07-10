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
      date,
    };
    
    for (let year = 2025; year <= 2030; year++) {
      emissionsData[`scope1_${year}`] = Number(formData.get(`scope1_${year}`)) || 0;
      emissionsData[`scope2_${year}`] = Number(formData.get(`scope2_${year}`)) || 0;
    }

    // Prepare renewable energy data
    const renewableData = {
      plant_id: plant.id,
      date,
    };

    for (let year = 2025; year <= 2030; year++) {
      renewableData[`solar_${year}`] = Number(formData.get(`solar_${year}`)) || 0;
      renewableData[`wind_${year}`] = Number(formData.get(`wind_${year}`)) || 0;
      renewableData[`others_${year}`] = Number(formData.get(`others_${year}`)) || 0;
    }

    // Save emissions data
    const { error: emissionsError } = await supabase
      .from('emissions')
      .upsert(emissionsData, { onConflict: 'plant_id,date' });

    if (emissionsError) throw emissionsError;

    // Save renewable energy data
    const { error: renewableError } = await supabase
      .from('renewable_energy')
      .upsert(renewableData, { onConflict: 'plant_id,date' });

    if (renewableError) throw renewableError;

    return { 
      success: true,
      businessId: business.id,
      plantId: plant.id 
    };
  } catch (error) {
    console.error('Save error:', error);
    return { success: false, error: error.message };
  }
};

export const uploadExcelFile = async (file, plantId, progressCallback) => {
  try {
    // Generate a unique filename to prevent conflicts
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    // Upload file to storage
    const { data, error: uploadError } = await supabase
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

    if (uploadError) throw uploadError;

    // Save file metadata to database
    const { error: dbError } = await supabase
      .from('plant_files')
      .insert({
        plant_id: plantId,
        original_filename: file.name,
        storage_path: filePath
      });

    if (dbError) throw dbError;

    return { 
      success: true, 
      filePath,
      originalFilename: file.name 
    };
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};