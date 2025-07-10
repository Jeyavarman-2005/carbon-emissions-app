export const prepareRenewableEnergyData = (renewableData) => {
  if (!renewableData) return [];
  
  const years = [2025, 2026, 2027, 2028, 2029, 2030];
  
  return years.map(year => ({
    year,
    solar: renewableData[`solar_${year}`] || 0,
    wind: renewableData[`wind_${year}`] || 0,
    others: renewableData[`others_${year}`] || 0,
    total: (renewableData[`solar_${year}`] || 0) + 
           (renewableData[`wind_${year}`] || 0) + 
           (renewableData[`others_${year}`] || 0)
  }));
};