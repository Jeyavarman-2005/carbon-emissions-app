// services/pythonOptimizer.js
import { loadPyodide } from 'pyodide';

let pyodideInstance = null;

export const runPythonOptimization = async (projects, constraints) => {
  try {
    if (!pyodideInstance) {
      pyodideInstance = await loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/"
      });
      await pyodideInstance.loadPackage(['pulp']);
    }

    const pythonCode = `
import json
from pulp import *
from datetime import datetime

def optimize_projects(projects, constraints):
    try:
        min_carbon_kg = float(constraints['carbonEmission']) * 1000
        max_investment = float(constraints['investment'])
        
        # Calculate timeline
        today = datetime.now()
        target_date = datetime.strptime(constraints['targetDate'], "%Y-%m-%d")
        max_timeline = (target_date - today).days / 365.25

        prob = LpProblem("ProjectSelection", LpMinimize)
        
        project_vars = LpVariable.dicts("project", range(len(projects)), cat='Binary')
        
        prob += lpSum(
            project_vars[i] * float(p['Estimated Investment in Rs.'])
            for i, p in enumerate(projects)
        ), "TotalInvestment"
        
        prob += lpSum(
            project_vars[i] * float(p['Estimated Carbon Reduction in Kg/CO2 per annum'])
            for i, p in enumerate(projects)
        ) >= min_carbon_kg, "CarbonReduction"
        
        prob += lpSum(
            project_vars[i] * float(p['Estimated Timeline'])
            for i, p in enumerate(projects)
        ) <= max_timeline, "Timeline"
        
        prob.solve()
        
        selected_projects = [
            projects[i] for i in range(len(projects))
            if project_vars[i].varValue > 0.9
        ]
        
        return {
            'status': LpStatus[prob.status],
            'selectedProjects': selected_projects,
            'totalInvestment': value(prob.objective),
            'totalCarbonReduction': sum(
                float(p['Estimated Carbon Reduction in Kg/CO2 per annum'])
                for p in selected_projects
            ),
            'maxTimeline': max(
                float(p['Estimated Timeline'])
                for p in selected_projects
            ) if selected_projects else 0
        }
    except Exception as e:
        return {'error': str(e)}

# Execute optimization
try:
    data = json.loads('${JSON.stringify({
        projects,
        constraints: {
            ...constraints,
            targetDate: constraints.targetDate.toISOString().split('T')[0]
        }
    })}')
    result = optimize_projects(data['projects'], data['constraints'])
    print(json.dumps(result))
except Exception as e:
    print(json.dumps({'error': str(e)}))
`;

    const result = await pyodideInstance.runPythonAsync(pythonCode);
    return JSON.parse(result);
  } catch (error) {
    console.error('Python execution error:', error);
    throw error;
  }
};