export function optimizeProjects(projects, constraints) {
  // Convert constraints
  const maxInvestment = Number(constraints.investment) || Infinity;
  const minCarbonKg = (Number(constraints.carbonEmission) || 0);
  const maxTotalTimeline = constraints.targetDate ? 
    calculateTimeline(constraints.targetDate) : 
    Infinity;

  // Determine optimization mode based on provided constraints
  const optimizationMode = 
    !isFinite(maxInvestment) ? 'TIMELINE_CARBON_ONLY' :
    minCarbonKg <= 0 ? 'INVESTMENT_TIMELINE_ONLY' :
    'FULL_CONSTRAINTS';

  console.log('Optimization mode:', optimizationMode, {
    maxInvestment,
    minCarbonKg,
    maxTotalTimeline
  });

  // Initialize best solution
  let bestSolution = {
    selectedIndices: [],
    totalInvestment: 0,
    totalCarbonReduction: 0,
    maxProjectTimeline: 0,
    totalTimeline: 0,
    isValid: false
  };

  // Recursive backtracking function
  function backtrack(index, currentSelection, currentInvestment, currentCarbon, currentMaxTime, currentTotalTime) {
    // Base case - all projects considered
    if (index === projects.length) {
      let meetsConstraints = false;
      
      switch (optimizationMode) {
        case 'TIMELINE_CARBON_ONLY': // Only timeline and carbon constraints
          meetsConstraints = currentCarbon >= minCarbonKg && currentTotalTime <= maxTotalTimeline;
          break;
          
        case 'INVESTMENT_TIMELINE_ONLY': // Only investment and timeline constraints
          meetsConstraints = currentInvestment <= maxInvestment && currentTotalTime <= maxTotalTimeline;
          // Find solution with maximum carbon reduction within investment
          if (meetsConstraints && (
            !bestSolution.isValid || 
            currentCarbon > bestSolution.totalCarbonReduction ||
            (currentCarbon === bestSolution.totalCarbonReduction && currentInvestment < bestSolution.totalInvestment)
          )) {
            bestSolution = {
              selectedIndices: [...currentSelection],
              totalInvestment: currentInvestment,
              totalCarbonReduction: currentCarbon,
              maxProjectTimeline: currentMaxTime,
              totalTimeline: currentTotalTime,
              isValid: true
            };
          }
          return;
          
        case 'FULL_CONSTRAINTS': // All constraints
          meetsConstraints = currentCarbon >= minCarbonKg && 
                           currentInvestment <= maxInvestment && 
                           currentTotalTime <= maxTotalTimeline;
          break;
      }

      if (meetsConstraints && (
        !bestSolution.isValid || 
        currentInvestment < bestSolution.totalInvestment ||
        (currentInvestment === bestSolution.totalInvestment && currentCarbon > bestSolution.totalCarbonReduction)
      )) {
        bestSolution = {
          selectedIndices: [...currentSelection],
          totalInvestment: currentInvestment,
          totalCarbonReduction: currentCarbon,
          maxProjectTimeline: currentMaxTime,
          totalTimeline: currentTotalTime,
          isValid: true
        };
      }
      return;
    }

    // Prune branches that can't be better than current best
    if (optimizationMode !== 'INVESTMENT_TIMELINE_ONLY' && 
        currentInvestment >= bestSolution.totalInvestment && 
        bestSolution.isValid) {
      return;
    }

    // Option 1: Skip this project
    backtrack(
      index + 1,
      currentSelection,
      currentInvestment,
      currentCarbon,
      currentMaxTime,
      currentTotalTime
    );

    // Option 2: Select this project (if within constraints)
    const project = projects[index];
    const newInvestment = currentInvestment + (project['Estimated Investment in Rs.'] || 0);
    const newCarbon = currentCarbon + (project['Estimated Carbon Reduction in Kg/CO2 per annum'] || 0);
    const newMaxTime = Math.max(currentMaxTime, project['Estimated Timeline'] || 0);
    const newTotalTime = currentTotalTime + (project['Estimated Timeline'] || 0);
    
    // Check relevant constraints based on mode
    const withinInvestment = newInvestment <= maxInvestment;
    const withinTimeline = newTotalTime <= maxTotalTimeline;
    
    if ((optimizationMode === 'INVESTMENT_TIMELINE_ONLY' && withinInvestment && withinTimeline) ||
        (optimizationMode !== 'INVESTMENT_TIMELINE_ONLY' && withinInvestment && withinTimeline)) {
      currentSelection.push(index);
      backtrack(
        index + 1,
        currentSelection,
        newInvestment,
        newCarbon,
        newMaxTime,
        newTotalTime
      );
      currentSelection.pop();
    }
  }

  // Start the optimization
  backtrack(0, [], 0, 0, 0, 0);

  // Prepare results
  if (!bestSolution.isValid) {
    return { status: 'infeasible' };
  }

  const selectedProjects = bestSolution.selectedIndices.map(i => projects[i]);

  return {
    status: 'optimal',
    selectedProjects,
    totalInvestment: bestSolution.totalInvestment,
    totalCarbonReduction: bestSolution.totalCarbonReduction,
    maxProjectTimeline: bestSolution.maxProjectTimeline,
    totalTimeline: bestSolution.totalTimeline
  };
}


function calculateTimeline(targetDate) {
  try {
    const today = new Date();
    const target = new Date(targetDate);
    
    if (isNaN(target.getTime())) {
      console.warn('Invalid target date:', targetDate);
      return Infinity;
    }
    
    const yearsDiff = target.getFullYear() - today.getFullYear();
    const monthsDiff = target.getMonth() - today.getMonth();
    const daysDiff = target.getDate() - today.getDate();
    
    // Calculate total years with fractions
    const totalYears = yearsDiff + (monthsDiff / 12) + (daysDiff / 365);
    
    console.log('Timeline calculation:', {
      today,
      target,
      yearsDiff,
      monthsDiff,
      daysDiff,
      totalYears
    });
    
    return Math.max(0, totalYears);
  } catch (error) {
    console.error('Error calculating timeline:', error);
    return Infinity;
  }
}