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

export const getPlantData = async (businessId, plantId = null) => {
  try {
    if (plantId) {
      const { data: plant, error: plantError } = await supabase
        .from('plants')
        .select('id, name, business:businesses(name)')
        .eq('id', plantId)
        .single();

      if (plantError) throw plantError;

      const { data: emissions, error: emissionsError } = await supabase
        .from('emissions')
        .select('*')
        .eq('plant_id', plantId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      return {
        businessName: plant.business.name,
        plantName: plant.name, // Add plant name to response
        emissionsData: emissions
      };
    } else {
      // Get all plants for business
      const { data: plants, error: plantsError } = await supabase
        .from('plants')
        .select('id, name')
        .eq('business_id', businessId)
        .order('name', { ascending: true });

      if (plantsError) throw plantsError;

      return {
        plants: plants || [],
        emissionsData: null,
        businessName: ''
      };
    }
  } catch (error) {
    console.error('Error fetching plant data:', error);
    throw error;
  }
};

export const downloadExcelFile = async (businessName, plantName) => {
  try {
    const fileName = `${businessName}_${plantName}.xlsx`;
    const { data, error } = await supabase
      .storage
      .from('project-files')
      .download(`uploads/${fileName}`);

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error downloading file:', error);
    throw error;
  }
};