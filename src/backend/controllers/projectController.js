import supabase from '../config/supabase';
import * as XLSX from 'xlsx';

export const uploadProjectFile = async (businessId, plantId, fileBuffer) => {
  try {
    const timestamp = new Date().getTime();
    const filePath = `projects/${businessId}/${plantId}/file_${timestamp}.xlsx`;
    
    const { data, error } = await supabase.storage
      .from('co2-project-files')
      .upload(filePath, fileBuffer, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true
      });

    if (error) throw error;
    return { success: true, path: filePath };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: error.message };
  }
};

  export const getFilteredProjects = async (businessId, plantId, filters) => {
    try {
      // Download from Supabase Storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('co2-project-files')
        .download(`${businessId}/${plantId}/projects.xlsx`);

      if (downloadError) throw downloadError;

      // Process Excel
      const buffer = await fileData.arrayBuffer();
      const workbook = XLSX.read(buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const projects = XLSX.utils.sheet_to_json(worksheet);

      // Apply filters
      return projects.filter(project => {
        const meetsPayback = !filters.paybackMonths || 
          (parseFloat(project['Payback period'].split(' ')[0]) * 12 <= filters.paybackMonths);
        const meetsInvestment = !filters.investmentLimit || 
          (project['Estimated Investment in Rs.'] <= filters.investmentLimit);
        const meetsCo2Target = !filters.co2Target || 
          (project['Estimated Carbon Reduction in Kg/CO2 per annum'] >= filters.co2Target * 1000);

        return meetsPayback && meetsInvestment && meetsCo2Target;
      });
    } catch (error) {
      console.error('Filter error:', error);
      return [];
    }
  };