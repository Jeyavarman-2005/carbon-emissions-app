export function optimizeProjects(projects, constraints) {
  // Convert constraints
  const maxInvestment = Number(constraints.investment) || Infinity;
  const minCarbonKg = (Number(constraints.carbonEmission) || 0);
  const maxProjectTimeline = constraints.targetDate ? 
    calculateTimeline(constraints.targetDate) : 
    Infinity;

  // Filter out projects that exceed timeline upfront
  const feasibleProjects = projects.filter(project => 
    (project['Estimated Timeline in months'] || 0) <= maxProjectTimeline
  );

  // Handle case when maxInvestment is Infinity
  if (!isFinite(maxInvestment)) {
    // Use greedy approach when no investment constraint
    const selectedProjects = [];
    let totalCarbon = 0;
    let totalInvestment = 0;
    let maxTime = 0;

    // Sort by carbon reduction (descending)
    feasibleProjects.sort((a, b) => 
      (b['Estimated Carbon Reduction in Kg/CO2 per annum'] || 0) - 
      (a['Estimated Carbon Reduction in Kg/CO2 per annum'] || 0)
    );

    // Select projects until carbon target is met
    for (const project of feasibleProjects) {
      if (totalCarbon >= minCarbonKg) break;
      
      selectedProjects.push(project);
      totalCarbon += project['Estimated Carbon Reduction in Kg/CO2 per annum'] || 0;
      totalInvestment += project['Estimated Investment in Rs.'] || 0;
      maxTime = Math.max(maxTime, project['Estimated Timeline in months'] || 0);
    }

    if (totalCarbon >= minCarbonKg) {
      return {
        status: 'optimal',
        selectedProjects,
        totalInvestment,
        totalCarbonReduction: totalCarbon,
        maxProjectTimeline: maxTime
      };
    } else {
      return { status: 'infeasible' };
    }
  }

  // For finite investment, use DP approach
  const dpSize = Math.min(maxInvestment, 1e8); // Safety limit for large investments
  const dp = Array(feasibleProjects.length + 1)
    .fill()
    .map(() => Array(dpSize + 1).fill({
      carbon: 0,
      selected: []
    }));

  // Dynamic programming approach
  for (let i = 1; i <= feasibleProjects.length; i++) {
    const project = feasibleProjects[i - 1];
    const investment = project['Estimated Investment in Rs.'] || 0;
    const carbon = project['Estimated Carbon Reduction in Kg/CO2 per annum'] || 0;

    for (let j = 0; j <= dpSize; j++) {
      if (investment > j) {
        dp[i][j] = dp[i - 1][j];
      } else {
        const include = {
          carbon: dp[i - 1][j - investment].carbon + carbon,
          selected: [...dp[i - 1][j - investment].selected, i - 1]
        };
        
        dp[i][j] = include.carbon > dp[i - 1][j].carbon ? include : dp[i - 1][j];
      }
    }
  }

  // Find best solution
  let bestSolution = null;
  for (let j = 0; j <= dpSize; j++) {
    const solution = dp[feasibleProjects.length][j];
    if (solution.carbon >= minCarbonKg) {
      if (!bestSolution || solution.carbon > bestSolution.carbon) {
        bestSolution = solution;
      }
    }
  }

  // Prepare results
  if (!bestSolution) {
    return { status: 'infeasible' };
  }

  const selectedProjects = bestSolution.selected.map(i => feasibleProjects[i]);
  const maxSingleProjectTimeline = Math.max(
    ...selectedProjects.map(p => p['Estimated Timeline in months'] || 0), 
    0
  );

  return {
    status: 'optimal',
    selectedProjects,
    totalInvestment: bestSolution.selected.reduce(
      (sum, i) => sum + (feasibleProjects[i]['Estimated Investment in Rs.'] || 0), 
      0
    ),
    totalCarbonReduction: bestSolution.carbon,
    maxProjectTimeline: maxSingleProjectTimeline
  };
}

function calculateTimeline(targetDate) {
  try {
    const today = new Date();
    const target = new Date(targetDate);
    if (isNaN(target.getTime())) return Infinity;
    
    // Calculate difference in months
    const months = (target.getFullYear() - today.getFullYear()) * 12 + 
                   (target.getMonth() - today.getMonth());
    return Math.max(0, months);
  } catch (error) {
    console.error('Error calculating timeline:', error);
    return Infinity;
  }
}