import React, { useState, useEffect, useReducer, useMemo, useCallback } from 'react';
import { getBusinesses, getPlantData, downloadExcelFile } from '../../services/api_op';
import { filterProjects } from '../../services/projectFilterService';
import { prepareChartDataWithTarget } from './reductionTargetService';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line, LabelList, Label } from 'recharts';
import { FiBriefcase, FiPackage, FiSettings, FiArrowRight, FiLoader, FiDownload } from 'react-icons/fi';
import { FiCalendar, FiDollarSign, FiTrendingUp, FiLock, FiUnlock, FiCheck } from 'react-icons/fi';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { throttle } from 'lodash';
import * as XLSX from 'xlsx';
import styles from './DashboardPage.module.css';

// Reducer for project parameters
const paramsReducer = (state, action) => {
  switch (action.type) {
    case 'UPDATE_DATE':
      return { ...state, targetDate: action.payload };
    case 'UPDATE_INVESTMENT':
      return { ...state, investment: action.payload };
    case 'UPDATE_EMISSION':
      return { ...state, carbonEmission: action.payload };
    case 'COMMIT_PARAMS':
      return { ...state, committed: true, ...action.payload };
    default:
      return state;
  }
};

// Memoized Chart Components
const EmissionsChart = React.memo(({ data, loading }) => {
  if (loading) return (
    <div className={styles.chartPlaceholder}>
      <div className={styles.placeholderContent}>
        <FiLoader className={styles.spinner} style={{ fontSize: '2rem' }} />
        <p>Loading emissions data...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className={styles.chartPlaceholder}>
      <div className={styles.placeholderContent}>
        <h3>No Chart Data</h3>
        <p>Select a business and plant to view emissions visualization</p>
      </div>
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height="90%">
      <ComposedChart
        data={data}
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
            fontWeight:"bold",
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
        {data.map((entry, index) => (
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
    </ResponsiveContainer>
  );
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) && 
         prevProps.loading === nextProps.loading;
});

const RenewableChart = React.memo(({ data, loading }) => {
  if (loading) return (
    <div className={styles.chartPlaceholder}>
      <div className={styles.placeholderContent}>
        <FiLoader className={styles.spinner} style={{ fontSize: '2rem' }} />
        <p>Loading renewable energy data...</p>
      </div>
    </div>
  );

  if (!data) return (
    <div className={styles.chartPlaceholder}>
      <p>No renewable energy data available</p>
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="year"
          tick={{ fill: '#6B7280' }}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis 
          domain={[0, 100]}
          label={{
            value: 'Percentage (%)',
            angle: -90,
            position: 'insideLeft',
            fill: '#6B7280',
            fontWeight: 'bold',
            dy: 50
          }}
        />
        <Tooltip 
          formatter={(value, name) => {
            if (name === 'total') return [`${value}%`, 'Total Renewable'];
            return [`${value}%`, name];
          }}
          contentStyle={{
            backgroundColor: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: '6px'
          }}
        />
        <Bar 
          dataKey="solar" 
          name="Solar" 
          stackId="a" 
          fill="#FFA500"
          radius={[4, 4, 0, 0]}
          barSize={50}
        >
          <LabelList 
            dataKey="solar" 
            position="inside" 
            formatter={(value) => value > 0 ? 'S' : ''}
            fill="#fff"
          />
        </Bar>
        <Bar 
          dataKey="wind" 
          name="Wind" 
          stackId="a" 
          fill="#1E90FF"
          radius={[4, 4, 0, 0]}
          barSize={50}
        >
          <LabelList 
            dataKey="wind" 
            position="inside" 
            formatter={(value) => value > 0 ? 'W' : ''}
            fill="#fff"
          />
        </Bar>
        <Bar 
          dataKey="others" 
          name="Others" 
          stackId="a" 
          fill="#9370DB"
          radius={[4, 4, 0, 0]}
          barSize={50}
        >
          <LabelList 
            dataKey="others" 
            position="inside" 
            formatter={(value) => value > 0 ? 'O' : ''}
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
      </ComposedChart>
    </ResponsiveContainer>
  );
}, (prevProps, nextProps) => {
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) && 
         prevProps.loading === nextProps.loading;
});

const DashboardPage = () => {
  const [businesses, setBusinesses] = useState([]);
  const [plants, setPlants] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [selectedPlant, setSelectedPlant] = useState('');
  const [selectedBusinessName, setSelectedBusinessName] = useState('');
  const [selectedPlantName, setSelectedPlantName] = useState('');
  const [emissionsData, setEmissionsData] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [committedParams, setCommittedParams] = useState(null);
  const [initialEmissionsData, setInitialEmissionsData] = useState(null);
  const [renewableData, setRenewableData] = useState(null);
  const [loading, setLoading] = useState({
    businesses: false,
    plants: false,
    emissions: false,
    projects: false,
    download: false,
    submit: false 
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

  // Use reducer for parameters
  const [params, dispatch] = useReducer(paramsReducer, {
    targetDate: new Date(),
    investment: '',
    carbonEmission: '',
    committed: false
  });
  const [summaryInfo, setSummaryInfo] = useState({
  type: null, // 'carbon' or 'investment'
  value: null
});
  const handleExcelDownload = async (
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

  useEffect(() => {
    if (emissionsData && !initialEmissionsData) {
      setInitialEmissionsData({...emissionsData});
    }
  }, [emissionsData]);

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

  useEffect(() => {
  if (selectedBusiness) {
    const loadPlants = async () => {
      try {
        setLoading(prev => ({ ...prev, plants: true }));
        setError('');
        setSelectedPlant('');
        setEmissionsData(null);
        setRenewableData(null);
        // Reset projects data when business changes
        setAllProjects([]);
        setFilteredProjects([]);
        setTopProjects([
          { id: 1, name: '--', reduction: '--', investment: '--', TimeTaken: '--' },
          { id: 2, name: '--', reduction: '--', investment: '--', TimeTaken: '--' },
          { id: 3, name: '--', reduction: '--', investment: '--', TimeTaken: '--' },
          { id: 4, name: '--', reduction: '--', investment: '--', TimeTaken: '--' },
          { id: 5, name: '--', reduction: '--', investment: '--', TimeTaken: '--' }
        ]);
        
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

  useEffect(() => {
  if (selectedBusiness && selectedPlant) {
    const loadPlantData = async () => {
      try {
        setLoading(prev => ({ ...prev, plants: true, emissions: true, projects: true }));
        setError('');
        
        // Reset projects to loading state
        setTopProjects([
          { id: 1, name: 'Loading...', reduction: '--', investment: '--', TimeTaken: '--' },
          { id: 2, name: 'Loading...', reduction: '--', investment: '--', TimeTaken: '--' },
          { id: 3, name: 'Loading...', reduction: '--', investment: '--', TimeTaken: '--' },
          { id: 4, name: 'Loading...', reduction: '--', investment: '--', TimeTaken: '--' },
          { id: 5, name: 'Loading...', reduction: '--', investment: '--', TimeTaken: '--' }
        ]);

        const response = await getPlantData(selectedBusiness, selectedPlant);
        
        if (response.emissionsData) {
          setEmissionsData(response.emissionsData);
        }
        if (response.renewableData) {
          setRenewableData(response.renewableData);
        }
        
        // Make sure to pass all required parameters to handleExcelDownload
        await handleExcelDownload(
          response,
          setAllProjects,
          setFilteredProjects,
          setTopProjects,
          setError,
          selectedBusinessName,
          selectedPlantName
        );
        
      } catch (error) {
        console.error('Plant data load error:', error);
        setError('Failed to load plant data');
        // Reset to empty state on error
        setTopProjects([
          { id: 1, name: '--', reduction: '--', investment: '--', TimeTaken: '--' },
          { id: 2, name: '--', reduction: '--', investment: '--', TimeTaken: '--' },
          { id: 3, name: '--', reduction: '--', investment: '--', TimeTaken: '--' },
          { id: 4, name: '--', reduction: '--', investment: '--', TimeTaken: '--' },
          { id: 5, name: '--', reduction: '--', investment: '--', TimeTaken: '--' }
        ]);
      } finally {
        setLoading(prev => ({ ...prev, plants: false, emissions: false, projects: false }));
      }
    };
    loadPlantData();
  }
}, [selectedBusiness, selectedPlant]);

  // Store initial emissions data
  useEffect(() => {
    if (emissionsData && !initialEmissionsData) {
      setInitialEmissionsData({...emissionsData});
    }
  }, [emissionsData]);

  // Throttled parameter handlers
  const throttledHandleParamChange = useMemo(
    () => throttle((e) => {
      const { name, value } = e.target;
      dispatch({ 
        type: name === 'investment' ? 'UPDATE_INVESTMENT' : 'UPDATE_EMISSION',
        payload: value
      });
    }, 300),
    []
  );

  const handleDateChange = useCallback((date) => {
    dispatch({ type: 'UPDATE_DATE', payload: date });
  }, []);

  // Memoized chart data
  const chartData = useMemo(() => {
    if (!emissionsData) return [];
    return prepareChartDataWithTarget(
      emissionsData,
      params,
      isSubmitted,
      filteredProjects
    );
  }, [emissionsData, params, isSubmitted, filteredProjects]);

  const renewableChartData = useMemo(() => {
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
  }, [renewableData]);

  const handleSubmitParams = async () => {
    try {
      setLoading(prev => ({ ...prev, projects: true }));
      setIsSubmitted(true);
      setCommittedParams({...params});
      
      // Show loading state for top projects
      setTopProjects([
        { id: 1, name: 'Loading...', reduction: '--', investment: '--', TimeTaken: '--' },
        { id: 2, name: 'Loading...', reduction: '--', investment: '--', TimeTaken: '--' },
        { id: 3, name: 'Loading...', reduction: '--', investment: '--', TimeTaken: '--' },
        { id: 4, name: 'Loading...', reduction: '--', investment: '--', TimeTaken: '--' },
        { id: 5, name: 'Loading...', reduction: '--', investment: '--', TimeTaken: '--' }
      ]);
      
      const { filteredProjects, topProjects, summary, message } = 
        await filterProjects(allProjects, {
          investment: params.investment,
          carbonEmission: params.carbonEmission,
          targetDate: params.targetDate.toISOString()
        });
      
      setTopProjects(topProjects);
      setFilteredProjects(filteredProjects);

      // Determine which label to show
      if (params.investment && params.carbonEmission) {
        // Both constraints - hide label
        setSummaryInfo({ type: null, value: null });
      } else if (params.investment) {
        // Only investment constraint - show carbon reduction
        setSummaryInfo({
          type: 'carbon',
          value: summary.totalCarbonReduction
        });
      } else if (params.carbonEmission) {
        // Only carbon constraint - show required investment
        setSummaryInfo({
          type: 'investment',
          value: summary.totalInvestment
        });
      }
      
      setEmissionsData(prev => ({...prev}));
      
      if (filteredProjects.length === 0) {
        alert(message || 'No projects matched your criteria. Try adjusting parameters.');
      } else {
        alert(`${filteredProjects.length} projects selected with total investment ₹${summary.totalInvestment.toLocaleString()}`);
      }
    } catch (error) {
      console.error('Optimization Error:', error);
      alert('Failed to optimize projects. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, projects: false }));
    }
  };

  const handleDownloadProjects = async () => {
    try {
      if (filteredProjects.length === 0) {
        alert('No projects to download');
        return;
      }
      setLoading(prev => ({ ...prev, download: true }));
      let businessName = selectedBusinessName;
      let plantName = selectedPlantName;
      if (!businessName || !plantName) {
        const businessObj = businesses.find(b => b.id === selectedBusiness);
        const plantObj = plants.find(p => p.id === selectedPlant);
        businessName = businessObj?.name || 'business';
        plantName = plantObj?.name || 'plant';
      }
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(
        filteredProjects.map(p => ({
          'Project': (p['Project Information in details']),
          'Category': p.Category,
          'Approach': p.Approach,
          'Carbon Reduction (Kg)': (p['Estimated Carbon Reduction in Kg/CO2 per annum']),
          'Investment (Rs.)': p['Estimated Investment in Rs.'],
          'Timeline': p['Estimated Timeline in months']
        }))
      );
      XLSX.utils.book_append_sheet(wb, ws, "Filtered Projects");
      const fileName = `FilteredProjects_${businessName}_${plantName}_${new Date().toISOString().slice(0,10)}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Download error: ${error.message}`);
    } finally {
      setLoading(prev => ({ ...prev, download: false }));
    }
  };


  return (
    <div className={styles.dashboardContainer}>
      <Header />
      
      {loading.submit && (
        <div className={styles.loadingOverlay}>
          <FiLoader className={styles.spinner} />
          <p>Optimizing projects based on your constraints...</p>
        </div>
      )}

      {error && (
        <div className={styles.errorBanner}>
          <p>{error}</p>
          <button onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <div className={styles.topSection}>
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

        <div className={styles.constraintsCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Project Parameters</h3>
          </div>
          <div className={styles.constraintsForm}>
            <div className={styles.formRow}>
              <div className={styles.inputGroup}>
                <label>Target Year</label>
                <DatePicker
                  selected={params.targetDate}
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
                    value={params.investment}
                    onChange={throttledHandleParamChange}
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
                  value={params.carbonEmission}
                  onChange={throttledHandleParamChange}
                  placeholder="0.00"
                  min="0"
                />
              </div>
            </div>
            <div className={styles.buttonGroup}>
  <button
    className={styles.saveButton}
    onClick={handleSubmitParams}
    disabled={!selectedBusiness || !selectedPlant || loading.submit}
  >
    {loading.submit ? (
      <FiLoader className={styles.spinner} />
    ) : (
      <>
        SUBMIT
        <FiArrowRight className={styles.buttonIcon} />
      </>
    )}
  </button>
  {summaryInfo.type && (
    <div className={styles.summaryLabel}>
      {summaryInfo.type === 'carbon' ? 'Reduced Carbon: ' : 'Required Investment: '}
      {summaryInfo.type === 'carbon' 
        ? `${summaryInfo.value.toLocaleString()} Kg/CO₂`
        : `₹${summaryInfo.value.toLocaleString()}`
      }
    </div>
  )}
</div>
          </div>
        </div>
      </div>

      <div className={styles.mainContent}>
        <div className={styles.leftColumn}>
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
              <EmissionsChart 
                data={chartData} 
                loading={loading.emissions} 
              />
            </div>
          </div>

          <div className={styles.chartSection} style={{ marginTop: '2rem' }}>
            <div className={styles.sectionHeader}>
              <h2>RENEWABLE ENERGY MIX (%)</h2>
              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendColor} ${styles.solar}`}></span>
                  <span>Solar</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendColor} ${styles.wind}`}></span>
                  <span>Wind</span>
                </div>
                <div className={styles.legendItem}>
                  <span className={`${styles.legendColor} ${styles.others}`}></span>
                  <span>Others</span>
                </div>
              </div>
            </div>
            <div className={styles.chartWrapper}>
              <RenewableChart 
                data={renewableChartData} 
                loading={loading.emissions} 
              />
            </div>
          </div>
        </div>

        <div className={styles.rightColumn}>
          <div className={styles.tableSection}>
            <div className={styles.sectionHeader}>
              <h2>CARBON EMISSIONS</h2>
              <span className={styles.units}>Kgs/year</span>
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