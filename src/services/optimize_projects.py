import json
import sys
from datetime import datetime
from pulp import *

def calculate_timeline(target_date_str):
    """Calculate timeline in years from today to target date"""
    try:
        today = datetime.now()
        target_date = datetime.strptime(target_date_str, "%Y-%m-%d")
        delta = target_date - today
        return delta.days / 365.25  # Account for leap years
    except:
        return float('inf')  # Return infinity if date parsing fails

def optimize_projects(data):
    try:
        projects = data['projects']
        constraints = data['constraints']
        
        # Validate input data
        if not projects or not isinstance(projects, list):
            raise ValueError("Invalid projects data")
        
        # Convert constraints
        min_carbon_kg = float(constraints.get('carbonEmission', 0)) * 1000
        max_investment = float(constraints.get('investment', float('inf')))
        
        # Calculate timeline from target date
        target_date = constraints.get('targetDate')
        if target_date:
            max_timeline = calculate_timeline(target_date)
        else:
            max_timeline = float(constraints.get('timeline', float('inf')))

        # Create the problem
        prob = LpProblem("ProjectSelection", LpMinimize)
        
        # Decision variables
        project_vars = LpVariable.dicts(
            "project", 
            range(len(projects)), 
            cat='Binary'
        )
        
        # Objective function (minimize investment)
        prob += lpSum(
            project_vars[i] * float(projects[i].get('Estimated Investment in Rs.', 0))
            for i in range(len(projects))
        ), "TotalInvestment"
        
        # Constraints
        prob += lpSum(
            project_vars[i] * float(projects[i].get('Estimated Carbon Reduction in Kg/CO2 per annum', 0))
            for i in range(len(projects))
        ) >= min_carbon_kg, "CarbonReduction"
        
        prob += lpSum(
            project_vars[i] * float(projects[i].get('Estimated Timeline', 0))
            for i in range(len(projects))
        ) <= max_timeline, "Timeline"
        
        # Solve the problem
        prob.solve(PULP_CBC_CMD(msg=False))
        
        # Prepare results
        selected_projects = []
        for i in range(len(projects)):
            if project_vars[i].varValue > 0.9:  # Selected project
                selected_projects.append(projects[i])
        
        return {
            'status': LpStatus[prob.status],
            'selectedProjects': selected_projects,
            'totalInvestment': value(prob.objective),
            'totalCarbonReduction': sum(
                float(p.get('Estimated Carbon Reduction in Kg/CO2 per annum', 0))
                for p in selected_projects
            ),
            'maxTimeline': max(
                float(p.get('Estimated Timeline', 0))
                for p in selected_projects
            ) if selected_projects else 0
        }
        
    except Exception as e:
        return {'error': f"Optimization error: {str(e)}"}

if __name__ == "__main__":
    try:
        # Read input from command line argument
        if len(sys.argv) < 2:
            raise ValueError("No input data provided")
        
        input_data = sys.argv[1]
        data = json.loads(input_data)
        
        # Run optimization
        result = optimize_projects(data)
        
        # Output results
        print(json.dumps(result))
        
    except Exception as e:
        print(json.dumps({'error': f"Main error: {str(e)}"}))
        sys.exit(1)