import supabase from '../backend/config/supabase';
import * as XLSX from 'xlsx';

export async function downloadAndFilterExcelBrowser(filename, userInvestment) {
  const { data, error } = await supabase
    .storage
    .from('project-files')
    .download(`test/${filename}`);

  if (error) {
    console.error('Download failed:', error.message);
    return;
  }

  let blob;
  // If it's already a Blob, use it directly
  if (data instanceof Blob) {
    blob = data;
  } else if (typeof data.blob === 'function') {
    blob = await data.blob();
  } else {
    console.error('Unknown download data type:', data);
    return;
  }

  const arrayBuffer = await blob.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(worksheet);

  const filtered = rows.filter(
    (row) => row['Estimated Investment in Rs.'] <= userInvestment
  );

  return filtered;
}
