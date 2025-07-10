export const calculateReductionTargetLine = (emissionsData, projectParams, filteredProjects) => {
  if (!emissionsData || !projectParams.targetDate) return null;

  // Get base year (2025) data
  const scope1_2025 = emissionsData.scope1_2025 || 0;
  const scope2_2025 = emissionsData.scope2_2025 || 0;
  const baseValue = scope1_2025 + scope2_2025;

  // Calculate target year from params
  const targetYear = projectParams.targetDate.getFullYear();
  
  // Don't draw line if target year is same as base year or in the past
  if (targetYear <= 2025) return null;

  // Calculate target value based on constraints
  let targetValue = baseValue;
  let reductionValue = 0;

  // Scenario 1: Both investment and carbon emission provided
  if (projectParams.investment && projectParams.carbonEmission) {
    reductionValue = parseFloat(projectParams.carbonEmission);
    targetValue = baseValue - reductionValue;
  } 
  // Scenario 2: Only carbon emission provided
  else if (projectParams.carbonEmission) {
    reductionValue = parseFloat(projectParams.carbonEmission) ;
    targetValue = baseValue - reductionValue;
  }
  // Scenario 3: Only investment provided - USE ACTUAL PROJECT REDUCTIONS
  else if (projectParams.investment && filteredProjects?.length > 0) {
    // Calculate total carbon reduction from selected projects (convert tons to kg)
    reductionValue = filteredProjects.reduce((sum, project) => {
      return sum + (project['Estimated Carbon Reduction in Kg/CO2 per annum'] || 0);
    }, 0);
    
    targetValue = Math.max(0, baseValue - reductionValue);
  }
  // Fallback for investment-only case with no projects
  else if (projectParams.investment) {
    return null; // Don't show line if no projects are selected
  }

  // Create points for all years between 2025 and target year
  const linePoints = [];
  const yearDiff = targetYear - 2025;
  
  for (let i = 0; i <= yearDiff; i++) {
    const currentYear = 2025+i;
    // Linear interpolation between start and end values
    const currentValue = (baseValue + (targetValue - baseValue) * (i / yearDiff))+1;
    
    linePoints.push({
      year: currentYear.toString(),
      value: currentValue,
      // Only show reduction value at the target point
      reduction: i === yearDiff ? reductionValue : null
    });
  }

  return linePoints;
};

export const prepareChartDataWithTarget = (
  barData,       // Data for bar values (initial)
  lineData,      // Data for line calculations (current)
  projectParams, 
  isSubmitted, 
  filteredProjects
) => {
  const baseChartData = [];
  
  // Prepare bar chart data using initial values
  for (let year = 2025; year <= 2030; year++) {
    const scope1 = barData[`scope1_${year}`] || 0;
    const scope2 = barData[`scope2_${year}`] || 0;
    const total = scope1 + scope2;
    
    baseChartData.push({
      year: year.toString(),
      scope1,
      scope2,
      total
    });
  }

  // Calculate target line using current data
  const reductionLine = isSubmitted 
    ? calculateReductionTargetLine(lineData, projectParams, filteredProjects) 
    : null;

  return baseChartData.map(item => ({
    ...item,
    targetValue: reductionLine?.find(point => point.year === item.year)?.value || null
  }));
};