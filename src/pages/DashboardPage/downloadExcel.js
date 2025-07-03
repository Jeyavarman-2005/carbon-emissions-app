import { downloadExcelFile } from '../../services/api_op';
import supabase from '../../backend/config/supabase';
import * as XLSX from 'xlsx';


export const handleExcelDownload = async (
  response, // This now contains both businessName and plantName
  setAllProjects,
  setFilteredProjects,
  setTopProjects,
  setError
) => {
  console.group('=== Excel Download ===');
  try {
    if (!response?.businessName || !response?.plantName) {
      throw new Error('Business or plant name not available');
    }

    const fileName = `${response.businessName}_${response.plantName}.xlsx`;
    console.log('Downloading Excel file:', fileName);
    
    const { data: file, error } = await supabase
      .storage
      .from('project-files')
      .download(`uploads/${fileName}`);

    if (error) throw error;

    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const projects = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    console.log(`Loaded ${projects.length} projects from ${fileName}`);
    
    setAllProjects(projects);
    setFilteredProjects(projects);
    
    const initialTop5 = projects
      .sort((a, b) => b['Estimated Carbon Reduction in Kg/CO2 per annum'] - 
                      a['Estimated Carbon Reduction in Kg/CO2 per annum'])
      .slice(0, 5)
      .map((p, i) => ({
        id: i + 1,
        name: p.Project,
        reduction: (p['Estimated Carbon Reduction in Kg/CO2 per annum'] / 1000).toFixed(2),
        investment: p['Estimated Investment in Rs.'].toLocaleString(),
        TimeTaken: p['Estimated Timeline']
      }));
    
    setTopProjects(initialTop5);
    
    return true;
  } catch (err) {
    console.error('Excel download error:', err);
    setError(`Failed to load project data. File:`);
    return false;
  } finally {
    console.groupEnd();
  }
};