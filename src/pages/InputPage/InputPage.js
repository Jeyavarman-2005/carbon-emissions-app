import React, { useState, useEffect } from 'react'; 
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import styles from './InputPage.module.css';
import { useForm } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { saveData } from '../../services/api_ip';
import { useNavigate } from 'react-router-dom';
import { FiUpload, FiDownload, FiCalendar, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { uploadExcelFile } from '../../services/uploadExcel';

const InputPage = () => {
  const { register, handleSubmit, control, formState: { errors }, watch } = useForm();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [formValid, setFormValid] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const businessName = watch("businessName");
  const plantName = watch("plantName");

  useEffect(() => {
    setFormValid(businessName?.trim() && plantName?.trim());
  }, [businessName, plantName]);
  
  const onSubmit = async (data) => {
    data.date = selectedDate;
    setIsProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('businessName', data.businessName);
      formData.append('plantName', data.plantName);
      
      // Add scope data
      for (let year = 2025; year <= 2030; year++) {
        formData.append(`scope1_${year}`, data[`scope1_${year}`] || 0);
        formData.append(`scope2_${year}`, data[`scope2_${year}`] || 0);
      }

       for (let year = 2025; year <= 2030; year++) {
        formData.append(`solar_${year}`, data[`solar_${year}`] || 0);
        formData.append(`wind_${year}`, data[`wind_${year}`] || 0);
        formData.append(`others_${year}`, data[`others_${year}`] || 0);
      }

      const result = await saveData(formData);
      
      if (result.success) {
        // Upload file if one was selected
        if (file && result.plantId) {
          await handleFileUpload(result.plantId);
        }
        
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          navigate('/success');
        }, 1500);
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error saving data: ' + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e) => {
    if (!formValid) {
      alert('Please enter Business Name and Plant Name first');
      return;
    }

    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit');
        return;
      }
      setFile(selectedFile);
      setUploadStatus(null);
      setUploadProgress(0);
    }
  };

  const handleFileUpload = async (plantId) => {
    if (!formValid) {
      alert('Please enter Business Name and Plant Name first');
      return;
    }

    if (!file) {
      alert('Please select a file first');
      return;
    }

    try {
      setUploadStatus('uploading');
      const result = await uploadExcelFile(file, plantId, (progress) => {
        setUploadProgress(progress);
      });
      
      if (result.success) {
        setUploadStatus('success');
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
    }
  };

  return (
    <div className={styles.dashboard}>
      <Header />
      <main className={styles.mainContent}>
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {/* Business and Plant Name */}
          <section className={styles.businessSection}>
            <div className={styles.inputCard}>
              <label className={styles.inputLabel}>
                <span className={styles.labelIcon}>🏢</span>
                Business Name
              </label>
              <input 
                {...register("businessName", { required: "Business name is required" })}
                type="text"
                placeholder="Enter business name"
                className={`${styles.inputField} ${errors.businessName ? styles.errorInput : ''}`}
              />
              {errors.businessName && <span className={styles.errorMessage}>{errors.businessName.message}</span>}
            </div>
            
            <div className={styles.inputCard}>
              <label className={styles.inputLabel}>
                <span className={styles.labelIcon}>🏭</span>
                Plant Name
              </label>
              <input 
                {...register("plantName", { required: "Plant name is required" })}
                type="text"
                placeholder="Enter plant name"
                className={`${styles.inputField} ${errors.plantName ? styles.errorInput : ''}`}
              />
              {errors.plantName && <span className={styles.errorMessage}>{errors.plantName.message}</span>}
            </div>
          </section>
          
           {/* Main Data Section */}
          <section className={styles.dataSection}>
            <div className={styles.emissionsCard}>
              <div className={styles.cardHeader}>
                <FiTrendingUp className={styles.cardIcon} />
                <h3>Carbon Emissions Forecast (Kg/year)</h3>
              </div>
              <div className={styles.tableContainer}>
                <table className={styles.emissionsTable}>
                  <thead>
                    <tr>
                      <th>Scope</th>
                      {[2025,2026, 2027, 2028, 2029, 2030].map(year => (
                        <th key={year}>{year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Scope 1</td>
                      {[2025,2026, 2027, 2028, 2029, 2030].map(year => (
                        <td key={`scope1-${year}`}>
                          <input 
                            {...register(`scope1_${year}`, { 
                              min: { value: 0, message: "Must be positive" }
                            })}
                            type="number"
                            step="0.01"
                            className={`${styles.tableInput} ${errors[`scope1_${year}`] ? styles.errorInput : ''}`}
                          />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Scope 2</td>
                      {[2025,2026, 2027, 2028, 2029, 2030].map(year => (
                        <td key={`scope2-${year}`}>
                          <input 
                            {...register(`scope2_${year}`, { 
                              min: { value: 0, message: "Must be positive" }
                            })}
                            type="number"
                            step="0.01"
                            className={`${styles.tableInput} ${errors[`scope2_${year}`] ? styles.errorInput : ''}`}
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* New Renewable Energy Table */}
            <div className={`${styles.emissionsCard} ${styles.renewableCard}`}>
              <div className={styles.cardHeader}>
                <FiTrendingUp className={styles.cardIcon} />
                <h3>Renewable Energy in Percentage (%)</h3>
              </div>
              <div className={styles.tableContainer}>
                <table className={styles.emissionsTable}>
                  <thead>
                    <tr>
                      <th>Source</th>
                      {[2025,2026, 2027, 2028, 2029, 2030].map(year => (
                        <th key={year}>{year}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Solar</td>
                      {[2025,2026, 2027, 2028, 2029, 2030].map(year => (
                        <td key={`solar-${year}`}>
                          <input 
                            {...register(`solar_${year}`, { 
                              min: { value: 0, message: "Must be positive" },
                              max: { value: 100, message: "Cannot exceed 100%" }
                            })}
                            type="number"
                            step="0.01"
                            className={`${styles.tableInput} ${errors[`solar_${year}`] ? styles.errorInput : ''}`}
                          />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Wind</td>
                      {[2025,2026, 2027, 2028, 2029, 2030].map(year => (
                        <td key={`wind-${year}`}>
                          <input 
                            {...register(`wind_${year}`, { 
                              min: { value: 0, message: "Must be positive" },
                              max: { value: 100, message: "Cannot exceed 100%" }
                            })}
                            type="number"
                            step="0.01"
                            className={`${styles.tableInput} ${errors[`wind_${year}`] ? styles.errorInput : ''}`}
                          />
                        </td>
                      ))}
                    </tr>
                    <tr>
                      <td>Others</td>
                      {[2025,2026, 2027, 2028, 2029, 2030].map(year => (
                        <td key={`others-${year}`}>
                          <input 
                            {...register(`others_${year}`, { 
                              min: { value: 0, message: "Must be positive" },
                              max: { value: 100, message: "Cannot exceed 100%" }
                            })}
                            type="number"
                            step="0.01"
                            className={`${styles.tableInput} ${errors[`others_${year}`] ? styles.errorInput : ''}`}
                          />
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
          
          {/* File Upload and Template - Swapped positions */}
         <section className={styles.fileSection}>
  <div className={styles.templateCard}>
    <div className={styles.cardHeader}>
      <FiDownload className={styles.cardIcon} />
      <h3>Download Template</h3>
    </div>
    <div className={styles.templateContent}>
      <img 
        src="/template.png" 
        alt="Excel Template Preview" 
        className={styles.templateImage}
      />
      <div className={styles.templateNote}>
        <p style={{color: 'red', fontWeight: 'bold'}}>
          IMPORTANT: Please do not change the column names or their order in the template.
        </p>
      </div>
      <a 
        href="/template.xlsx" 
        download 
        className={styles.downloadLink}
      >
        <FiDownload className={styles.downloadIcon} />
        Download Excel Template
      </a>
    </div>
  </div>
  
  <div className={styles.uploadCard}>
    <div className={styles.cardHeader}>
      <FiUpload className={styles.cardIcon} />
      <h3>Upload Project Data</h3>
      {!formValid && (
        <div className={styles.uploadRequirement}>
          * Please enter Business and Plant names first
        </div>
      )}
    </div>
    <div className={styles.uploadBox}>
      <label className={styles.uploadLabel}>
        <input 
          type="file"
          onChange={handleFileChange}
          accept=".xlsx,.xls,.csv"
          className={styles.fileInput}
          disabled={!formValid}
        />
        <div className={`${styles.uploadContent} ${!formValid ? styles.disabledUpload : ''}`}>
          <FiUpload className={styles.uploadIcon} />
          <p className={styles.uploadText}>
            {formValid 
              ? "Drag & drop your file here or click to browse"
              : "Please enter Business and Plant names first"}
          </p>
          <p className={styles.uploadSubtext}>
            {formValid 
              ? "Supports: .xlsx, .xls, .csv (Max 10MB)"
              : "File upload will be enabled after basic info is entered"}
          </p>
          {file && (
            <div className={styles.filePreview}>
              <p>Selected: {file.name}</p>
              <p className={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
        </div>
      </label>
      {file && formValid && (
  <div className={styles.uploadActions}>
    {uploadStatus === 'uploading' && (
      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill} 
          style={{ width: `${uploadProgress}%` }}
        ></div>
      </div>
    )}
    {uploadStatus === 'success' && (
      <div className={styles.uploadSuccess}>
        ✓ Upload completed successfully
      </div>
    )}
    {uploadStatus === 'error' && (
      <div className={styles.uploadError}>
        ✗ Upload failed. Please try again.
      </div>
    )}
  </div>
)}
    </div>
  </div>
</section>
          
          <div className={styles.actionBar}>
            <button type="submit" className={styles.submitButton} disabled={isProcessing}>
              {isProcessing ? (
                <div className={styles.spinner}></div>
              ) : (
                <>
                  Save & Process Data
                  <span className={styles.buttonArrow}>→</span>
                </>
              )}
            </button>
          </div>
        </form>
      </main>
      <Footer />

      {/* Success Popup */}
      {showSuccess && (
        <div className={styles.successPopup}>
          <div className={styles.successContent}>
            <div className={styles.successIcon}>✓</div>
            <div className={styles.successText}>Data Saved!</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InputPage;