import { downloadExcelFile } from '../../services/api_op';
import * as XLSX from 'xlsx';

export const handleExcelDownload = async (
  response,
  setAllProjects,
  setFilteredProjects,
  setTopProjects,
  setError,
  businessName,
  plantName
) => {
  console.log('[ExcelDownload] Starting download...');
  console.log('[ExcelDownload] Incoming response:', response);

  try {
    if (!response?.fileInfo?.storage_path) {
      console.warn('[ExcelDownload] No storage path found in response.');
      setError('No project file available for this plant');
      return false;
    }

    console.log('[ExcelDownload] Downloading file from:', response.fileInfo.storage_path);
    const file = await downloadExcelFile(response.fileInfo.storage_path);
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer);
    const projects = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    
    console.log(`[ExcelDownload] Loaded ${projects.length} projects`);
    
    setAllProjects(projects);
    setFilteredProjects(projects);
    
    const initialTop5 = projects
      .sort((a, b) => b['Estimated Carbon Reduction in Kg/CO2 per annum'] - 
                      a['Estimated Carbon Reduction in Kg/CO2 per annum'])
      .slice(0, 5)
      .map((p, i) => ({
        id: i + 1,
        name: (p['Project Information in details']),
        reduction: (p['Estimated Carbon Reduction in Kg/CO2 per annum']).toFixed(2),
        investment: p['Estimated Investment in Rs.'].toLocaleString(),
        TimeTaken: p['Estimated Timeline in months']
      }));
    
    setTopProjects(initialTop5);
    
    return true;
  } catch (err) {
    console.error('[ExcelDownload] Error:', err);
    setError(`Failed to load project data: ${err.message}`);
    return false;
  }
};