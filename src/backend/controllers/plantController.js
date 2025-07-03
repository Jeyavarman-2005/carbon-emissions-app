import supabase from '../config/supabase';

export const createPlant = async (plantData) => {
  const { data, error } = await supabase
    .from('plants')
    .insert([plantData])
    .select()
    .single();

  if (error) throw error;
  return data;
};