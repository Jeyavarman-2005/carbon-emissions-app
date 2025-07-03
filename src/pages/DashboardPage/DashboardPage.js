import React, { useState, useEffect } from 'react';
import { getBusinesses, getPlantData, downloadExcelFile } from '../../services/api_op';
import { filterProjects } from '../../services/projectFilterService';
import { prepareChartDataWithTarget } from './reductionTargetService';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { handleExcelDownload } from './downloadExcel';
import styles from './DashboardPage.module.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, ComposedChart, LabelList, Label } from 'recharts';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FiBriefcase, FiPackage, FiSettings, FiArrowRight, FiLoader, FiDownload } from 'react-icons/fi';
import { FiCalendar, FiDollarSign, FiTrendingUp, FiLock, FiUnlock, FiCheck } from 'react-icons/fi';
import * as XLSX from 'xlsx';

const DashboardPage = () => {
  const [businesses, setBusinesses] = useState([]);
  const [plants, setPlants] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [selectedPlant, setSelectedPlant] = useState('');
  const [selectedBusinessName, setSelectedBusinessName] = useState('');
  const [selectedPlantName, setSelectedPlantName] = useState('');
  const [emissionsData, setEmissionsData] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState({
    businesses: false,
    plants: false,
    emissions: false,
    projects: false,
    download: false
  });
  const [error, setError] = useState('');
  const [projectParams, setProjectParams] = useState({
    targetDate: new Date(),
    investment: '',
    carbonEmission: ''
  });
  const [topProjects, setTopProjects] = useState([
    { id: 1, name: '--', reduction: '--', investment: '--', TimeTaken: '--' },
    { id: 2, name: '--', reduction: '--', investment: '--', TimeTaken: '--' },
    { id: 3, name: '--', reduction: '--', investment: '--', TimeTaken: '--' },
    { id: 4, name: '--', reduction: '--', investment: '--', TimeTaken: '--' },
    { id: 5, name: '--', reduction: '--', investment: '--', TimeTaken: '--' }
  ]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [allProjects, setAllProjects] = useState([]);

  // Load businesses on mount
  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        setLoading(prev => ({ ...prev, businesses: true }));
        setError('');
        
        const businesses = await getBusinesses();
        
        if (!Array.isArray(businesses)) {
          throw new Error('Invalid business data format');
        }
        
        setBusinesses(businesses);
      } catch (error) {
        console.error('Load error:', error);
        setError(`Failed to load businesses. ${error.message}`);
      } finally {
        setLoading(prev => ({ ...prev, businesses: false }));
      }
    };
    
    loadBusinesses();
  }, []);

  // Load plants when business is selected
  useEffect(() => {
    if (selectedBusiness) {
      const loadPlants = async () => {
        try {
          setLoading(prev => ({ ...prev, plants: true }));
          setError('');
          setSelectedPlant('');
          setEmissionsData(null);
          
          const response = await getPlantData(selectedBusiness);
          
          if (!response.plants || !Array.isArray(response.plants)) {
            throw new Error('Invalid plants data format');
          }
          
          setPlants(response.plants);
        } catch (err) {
          setError('Failed to load plants');
          console.error('Plant load error:', err);
        } finally {
          setLoading(prev => ({ ...prev, plants: false }));
        }
      };
      
      loadPlants();
    }
  }, [selectedBusiness]);

  // Load emissions and projects when plant is selected
  useEffect(() => {
  if (selectedBusiness && selectedPlant) {
    const loadPlantData = async () => {
      console.group('=== Loading Plant Data ===');
      try {
        setLoading(prev => ({ ...prev, plants: true, emissions: true, projects: true }));
        setError('');
        
        console.log('Fetching plant data for:', { selectedBusiness, selectedPlant });
        
        // Load plant data from API
        const response = await getPlantData(selectedBusiness, selectedPlant);
        console.log('API Response:', response);
        
        if (response.emissionsData) {
          console.log('Emissions Data Found:', response.emissionsData);
          setEmissionsData(response.emissionsData);
        } else {
          console.warn('No emissions data found, using fallback data');
          setEmissionsData({
            scope1_2025: 0,
            scope2_2025: 0,
            // ... other years ...
          });
        }
        
        // Load Excel using the API response directly
        await handleExcelDownload(
          response,
          setAllProjects,
          setFilteredProjects,
          setTopProjects,
          setError
        );
        
      } catch (err) {
        console.error('Plant data load error:', err);
        setError('Failed to load plant data');
      } finally {
        console.groupEnd();
        setLoading(prev => ({ ...prev, plants: false, emissions: false, projects: false }));
      }
    };
    
    loadPlantData();
  }
}, [selectedBusiness, selectedPlant]);

// For manual download button
const handleManualDownload = async () => {
  setLoading(prev => ({ ...prev, download: true }));
  const success = await handleExcelDownload(
    businesses,
    plants,
    selectedBusiness,
    selectedPlant,
    setAllProjects,
    setFilteredProjects,
    setTopProjects,
    setError,
    selectedBusinessName, // Use state names
    selectedPlantName
  );
  setLoading(prev => ({ ...prev, download: false }));
  return success;
};

// For manual download button


  const prepareChartData = () => {
  if (!emissionsData) return [];
  return prepareChartDataWithTarget(emissionsData, projectParams, isSubmitted, filteredProjects);
};

  const handleSubmitParams = async () => {
  console.group('=== Project Optimization ===');
  try {
     setLoading(prev => ({ ...prev, projects: true }));
    setIsSubmitted(true); // <-- ADD THIS LINE
    
    console.log('Current Project Parameters:', {
      investment: projectParams.investment,
      carbonEmission: projectParams.carbonEmission,
      targetDate: projectParams.targetDate.toISOString()
    });

    console.log('All Projects Count:', allProjects.length);
    
    const { 
      filteredProjects, 
      topProjects,
      summary,
      message 
    } = await filterProjects(allProjects, {
      investment: projectParams.investment,
      carbonEmission: projectParams.carbonEmission,
      targetDate: projectParams.targetDate.toISOString()
    });

    console.log('Filter Results:', {
      filteredCount: filteredProjects.length,
      topProjects,
      summary
    });

    setTopProjects(topProjects);
    setFilteredProjects(filteredProjects);
    
    // Force chart update by triggering state change
    setEmissionsData(prev => ({...prev}));
    
    if (filteredProjects.length === 0) {
      console.warn('No projects matched criteria');
      alert(message || 'No projects matched your criteria. Try adjusting parameters.');
    } else {
      console.log('Projects filtered successfully');
      alert(`${filteredProjects.length} projects selected with total investment ₹${summary.totalInvestment.toLocaleString()}`);
    }
  } catch (error) {
    console.error('Optimization Error:', error);
    alert('Failed to optimize projects. Please try again.');
  } finally {
    console.groupEnd();
    setLoading(prev => ({ ...prev, projects: false }));
  }
};
  const handleDownloadProjects = async () => {
  console.group('=== Project Download ===');
  try {
    if (filteredProjects.length === 0) {
      console.warn('No projects to download');
      alert('No projects to download');
      return;
    }

    setLoading(prev => ({ ...prev, download: true }));
    
    // Get current business/plant names (use state if available, otherwise look up)
    let businessName = selectedBusinessName;
    let plantName = selectedPlantName;

    if (!businessName || !plantName) {
      const businessObj = businesses.find(b => b.id === selectedBusiness);
      const plantObj = plants.find(p => p.id === selectedPlant);
      businessName = businessObj?.name || 'business';
      plantName = plantObj?.name || 'plant';
    }

    console.log('Downloading filtered projects for:', `${businessName}_${plantName}`);

    // Create workbook with filtered data
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(
      filteredProjects.map(p => ({
        'Project': p.Project,
        'Category': p.Category,
        'Approach': p.Approach,
        'Carbon Reduction (Kg)': (p['Estimated Carbon Reduction in Kg/CO2 per annum']),
        'Investment (Rs.)': p['Estimated Investment in Rs.'],
        'Timeline': p['Estimated Timeline']
      }))
    );

    XLSX.utils.book_append_sheet(wb, ws, "Filtered Projects");
    
    // Generate filename
    const fileName = `FilteredProjects_${businessName}_${plantName}_${new Date().toISOString().slice(0,10)}.xlsx`;
    
    // Download the file
    XLSX.writeFile(wb, fileName);
    console.log(`Downloaded ${filteredProjects.length} filtered projects`);

  } catch (error) {
    console.error('Download failed:', error);
    alert(`Download error: ${error.message}`);
  } finally {
    console.groupEnd();
    setLoading(prev => ({ ...prev, download: false }));
  }
};

  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setProjectParams(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setProjectParams(prev => ({
      ...prev,
      targetDate: date
    }));
  };
  const chartData = prepareChartData();

  return (
    <div className={styles.dashboardContainer}>
      <Header />
      
      {/* Business and Plant Selector with Project Parameters */}
      <div className={styles.topSection}>
        {/* Left Component - Business/Plant Selection */}
        <div className={styles.businessSelector}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Mention Company Details</h3>
          </div>

          <div className={styles.selectorGrid}>
            <div className={styles.inputGroup}>
              <label>
                <FiBriefcase className={styles.inputIcon} />
                Business Unit
              </label>
              <select
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                className={styles.modernSelect}
              >
                <option value="">Select Business</option>
                {businesses.map(business => (
                  <option key={business.id} value={business.id}>{business.name}</option>
                ))}
              </select>
            </div>

            <div className={styles.inputGroup}>
              <label>
                <FiPackage className={styles.inputIcon} />
                Production Plant
              </label>
              <select
                value={selectedPlant}
                onChange={(e) => setSelectedPlant(e.target.value)}
                className={styles.modernSelect}
                disabled={!selectedBusiness || loading.plants}
              >
                <option value="">
                  {loading.plants ? (
                    <span className={styles.loadingText}>
                      <FiLoader className={styles.spinner} /> Loading plants...
                    </span>
                  ) : selectedBusiness ? "Select Plant" : "Select Business First"}
                </option>
                {plants.map(plant => (
                  <option key={plant.id} value={plant.id}>{plant.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Component - Project Constraints */}
        <div className={styles.constraintsCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Project Parameters</h3>
          </div>

          <div className={styles.constraintsForm}>
            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label>Target Year</label>
                <DatePicker
                  selected={projectParams.targetDate}
                  onChange={handleDateChange}
                  dateFormat="MM/yyyy"
                  showMonthYearPicker
                  className={styles.yearInput}
                  placeholderText="Select month and year"
                  minDate={new Date()}
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label>Investment (₹)</label>
                <div className={styles.currencyInput}>
                  <span>₹</span>
                  <input
                    type="number"
                    name="investment"
                    value={projectParams.investment}
                    onChange={handleParamChange}
                    placeholder="0.00"
                    min="0"
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>CO₂ Emission (Kg)</label>
                <input
                  type="number"
                    name="carbonEmission"
                    value={projectParams.carbonEmission}
                    onChange={handleParamChange}
                    placeholder="0.00"
                    min="0"
                  />
                </div>
              </div>

              <div className={styles.buttonGroup}>
                <button
                  className={styles.saveButton}
                  onClick={handleSubmitParams}
                  disabled={!selectedBusiness || !selectedPlant || loading.projects}
                >
                  {loading.projects ? (
                    <FiLoader className={styles.spinner} />
                  ) : (
                    <>
                      SUBMIT
                      <FiArrowRight className={styles.buttonIcon} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {loading.projects && (
          <div className={styles.loadingOverlay}>
            <FiLoader className={styles.spinner} />
            <p>Filtering projects...</p>
          </div>
        )}

        {error && (
          <div className={styles.errorBanner}>
            <p>{error}</p>
            <button onClick={() => setError('')}>Dismiss</button>
          </div>
        )}

        {/* Main Content */}
        <div className={styles.mainContent}>
          {/* Left Section - Chart */}
          <div className={styles.chartSection}>
            <div className={styles.sectionHeader}>
              <h2>EMISSIONS OVERVIEW</h2>
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <span className={styles.legendColor + ' ' + styles.scope1}></span>
                  <span>Scope 1</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendColor + ' ' + styles.scope2}></span>
                  <span>Scope 2</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={styles.legendColor + ' ' + styles.target}></span>
                  <span>Reduction Target</span>
                </div>
              </div>
            </div>
            
            <div className={styles.chartWrapper}>
              <ResponsiveContainer width="100%" height="90%">
                {loading.emissions ? (
                  <div className={styles.chartPlaceholder}>
                    <div className={styles.placeholderContent}>
                      <FiLoader className={styles.spinner} style={{ fontSize: '2rem' }} />
                      <p>Loading emissions data...</p>
                    </div>
                  </div>
                ) : emissionsData ? (
                  <ComposedChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                      padding={{ left: 20, right: 20 }}
                    />
                    <YAxis 
                      label={{ 
                        value: 'Carbon Emission in kg', 
                        angle: -90, 
                        position: 'insideLeft',
                        fill: '#6B7280',
                        fontWeight:"bold" ,
                        dy: 100
                      }}
                      tick={{ fill: '#6B7280' }}
                      axisLine={{ stroke: '#E5E7EB' }}
                    />
                    <Tooltip 
                      formatter={(value, name) => {
                        if (name === 'targetValue') return [`${value} tons`, 'Reduction Target'];
                        return [`${value} tons`, name];
                      }}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                      }}
                    />
                    <Bar 
                      dataKey="scope1" 
                      name="Scope 1" 
                      stackId="a" 
                      fill="#3B82F6"
                      radius={[4, 4, 0, 0]}
                      barSize={50}
                    >
                      <LabelList 
                        dataKey="scope1" 
                        position="inside" 
                        formatter={(value) => value > 0 ? `S1` : ''}
                        fill="#fff"
                      />
                    </Bar>
                    <Bar 
                      dataKey="scope2" 
                      name="Scope 2" 
                      stackId="a" 
                      fill="#10B981"
                      radius={[4, 4, 0, 0]}
                      barSize={50}
                    >
                      <LabelList 
                        dataKey="scope2" 
                        position="inside" 
                        formatter={(value) => value > 0 ? `S2` : ''}
                        fill="#fff"
                      />
                    </Bar>
                    <Bar 
                      dataKey="total" 
                      name="Total" 
                      fill="transparent"
                    >
                      <LabelList
                        dataKey="total"
                        position="top"
                        fill="#374151"
                        content={(props) => {
                          const { x, y, value } = props;
                          return (
                            <text
                              x={x - 30}
                              y={y-5}
                              fill="#374151"
                              textAnchor="middle"
                              fontSize={16}  
                              fontWeight="bold" 
                            >
                              {`Total: ${value}`}
                            </text>
                          );
                        }}
                      />
                    </Bar>
                    <Line
                      type="monotone"
                      dataKey="targetValue"
                      stroke="#EF4444"
                      strokeWidth={2}
                      dot={{ r: 4, fill: '#EF4444' }}
                      activeDot={{ r: 6, stroke: '#EF4444', strokeWidth: 2, fill: '#fff' }}
                      name="Reduction Target"
                    />
                    {/* Add this custom label for the reduction value */}
  {chartData.map((entry, index) => (
    entry.reduction && (
      <Label
        key={`reduction-label-${index}`}
        value={`Reduction: ${entry.reduction.toFixed(2)} kg`}
        position="top"
        offset={10}
        fill="#EF4444"
        fontWeight="bold"
      />
    )
  ))}
                  </ComposedChart>
                ) : (
                  <div className={styles.chartPlaceholder}>
                    <div className={styles.placeholderContent}>
                      <h3>No Chart Data</h3>
                      <p>Select a business and plant to view emissions visualization</p>
                    </div>
                  </div>
                )}
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Right Section - Tables */}
          <div className={styles.tablesSection}>
            {/* Emissions Table */}
            <div className={styles.tableSection}>
              <div className={styles.sectionHeader}>
                <h2>CARBON EMISSIONS</h2>
                <span className={styles.units}>tons/year</span>
              </div>
              
              <div className={styles.tableWrapper}>
                <table className={styles.emissionsTable}>
                  <thead>
                    <tr>
                      <th>SCOPE</th>
                      {[2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                        <th key={year}>{year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {emissionsData ? (
                      <>
                        <tr>
                          <td>Scope 1</td>
                          {[2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                            <td key={`scope1-${year}`}>
                              {emissionsData[`scope1_${year}`]?.toFixed(2) || '0.00'}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td>Scope 2</td>
                          {[2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                            <td key={`scope2-${year}`}>
                              {emissionsData[`scope2_${year}`]?.toFixed(2) || '0.00'}
                            </td>
                          ))}
                        </tr>
                        <tr className={styles.totalRow}>
                          <td>TOTAL</td>
                          {[2025, 2026, 2027, 2028, 2029, 2030].map(year => {
                            const scope1 = emissionsData[`scope1_${year}`] || 0;
                            const scope2 = emissionsData[`scope2_${year}`] || 0;
                            return (
                              <td key={`total-${year}`}>
                                {(scope1 + scope2).toFixed(2)}
                              </td>
                            );
                          })}
                        </tr>
                      </>
                    ) : (
                      <>
                        <tr>
                          <td>Scope 1</td>
                          {[2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                            <td key={`scope1-${year}`}>--</td>
                          ))}
                        </tr>
                        <tr>
                          <td>Scope 2</td>
                          {[2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                            <td key={`scope2-${year}`}>--</td>
                          ))}
                        </tr>
                        <tr className={styles.totalRow}>
                          <td>TOTAL</td>
                          {[2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                            <td key={`total-${year}`}>--</td>
                          ))}
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Projects Table */}
            <div className={styles.tableSection}>
              <div className={styles.sectionHeader}>
                <h2>TOP PROJECTS</h2>
                <span className={styles.units}>potential impact</span>
                <button 
                  onClick={handleDownloadProjects}
                  className={styles.downloadButton}
                  disabled={topProjects[0].name === '--' || loading.download}
                >
                  {loading.download ? (
                    <FiLoader className={styles.spinner} />
                  ) : (
                    <>
                      <FiDownload className={styles.downloadIcon} />
                      Download List
                    </>
                  )}
                </button>
              </div>
              
              <div className={styles.tableWrapper}>
                <table className={styles.projectsTable}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Project Name</th>
                      <th>Reduction (Kgs)</th>
                      <th>Investment (₹)</th>
                      <th>Time Taken</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProjects.map((project) => (
                      <tr key={project.id}>
                        <td>{project.id}</td>
                        <td>{project.name}</td>
                        <td>{project.reduction}</td>
                        <td>{project.investment}</td>
                        <td>{project.TimeTaken}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      <Footer />
    </div>
  );
};

export default DashboardPage;