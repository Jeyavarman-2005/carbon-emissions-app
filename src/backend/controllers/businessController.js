import supabase from '../config/supabase';

export const createBusiness = async (businessData) => {
  const { data, error } = await supabase
    .from('businesses')
    .insert([businessData])
    .select()
    .single();

  if (error) throw error;
  return data;
};