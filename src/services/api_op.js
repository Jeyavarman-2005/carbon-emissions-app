import supabase from '../backend/config/supabase';

export const getBusinesses = async () => {
  try {
    const { data, error } = await supabase
      .from('businesses')
      .select('id, name')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching businesses:', error);
    throw error;
  }
};

export const getRenewableEnergyData = async (businessId, plantId) => {
  try {
    const { data, error } = await supabase
      .from('renewable_energy')
      .select('*')
      .eq('plant_id', plantId)
      .order('date', { ascending: false })
      .limit(1);

    if (error) throw error;
    return data[0] || null;
  } catch (error) {
    console.error('Error fetching renewable energy data:', error);
    return null;
  }
};

export const getPlantData = async (businessId, plantId = null) => {
  try {
    if (plantId) {
      // Get complete plant data including latest file
      const { data: plantData, error: plantError } = await supabase
        .from('plants')
        .select(`
          id, 
          name, 
          business:businesses(name),
          emissions:emissions!plant_id(
            date, 
            scope1_2025, scope2_2025, 
            scope1_2026, scope2_2026, 
            scope1_2027, scope2_2027, 
            scope1_2028, scope2_2028, 
            scope1_2029, scope2_2029, 
            scope1_2030, scope2_2030
          ),
          renewable_energy:renewable_energy!plant_id(
            date, 
            solar_2025, wind_2025, others_2025,
            solar_2026, wind_2026, others_2026,
            solar_2027, wind_2027, others_2027,
            solar_2028, wind_2028, others_2028,
            solar_2029, wind_2029, others_2029,
            solar_2030, wind_2030, others_2030
          ),
          files:plant_files!plant_id(
            original_filename, 
            storage_path, 
            uploaded_at
          )
        `)
        .eq('id', plantId)
        .order('date', { foreignTable: 'emissions', ascending: false })
        .order('date', { foreignTable: 'renewable_energy', ascending: false })
        .order('uploaded_at', { foreignTable: 'plant_files', ascending: false })
        .limit(1, { foreignTable: 'emissions' })
        .limit(1, { foreignTable: 'renewable_energy' })
        .limit(1, { foreignTable: 'plant_files' })
        .single();

      if (plantError) throw plantError;

      return {
        businessName: plantData.business.name,
        plantName: plantData.name,
        emissionsData: plantData.emissions[0] || null,
        renewableData: plantData.renewable_energy[0] || null,
        fileInfo: plantData.files[0] || null
      };
    } else {
      // Get all plants for business (no emissions, renewable or file data)
      const { data: plants, error: plantsError } = await supabase
        .from('plants')
        .select('id, name')
        .eq('business_id', businessId)
        .order('name', { ascending: true });

      if (plantsError) throw plantsError;

      return {
        plants: plants || [],
        businessName: '',
        plantName: '',
        emissionsData: null,
        renewableData: null,
        fileInfo: null
      };
    }
  } catch (error) {
    console.error('Error fetching plant data:', error);
    throw error;
  }
};

export const downloadExcelFile = async (storagePath) => {
  try {
    const { data, error } = await supabase
      .storage
      .from('project-files')
      .download(storagePath);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};

export const getLatestPlantFile = async (plantId) => {
  try {
    const { data, error } = await supabase
      .from('plant_files')
      .select('original_filename, storage_path, uploaded_at')
      .eq('plant_id', plantId)
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching plant file:', error);
    return null;
  }
};