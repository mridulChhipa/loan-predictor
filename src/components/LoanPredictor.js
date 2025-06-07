'use client'
import { useState, useEffect } from 'react'

export default function LoanPredictor() {
    const [formData, setFormData] = useState({
        loan_type_name: '',
        loan_purpose_name: '',
        loan_amount_000s: '',
        
        applicant_income_000s: '',
        applicant_ethnicity_name: '',
        applicant_race_name_1: '',   
        applicant_sex_name: '',
        
        property_type_name: '',
        owner_occupancy_name: '',
        preapproval_name: '',
        
        purchaser_type_name: '',         
        lien_status_name: '',
        
        sequence_number: '1',
        number_of_owner_occupied_units: '',
        number_of_1_to_4_family_units: '',
        hud_median_family_income: '',
        tract_to_msamd_income: ''
    })

    const [prediction, setPrediction] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [validationErrors, setValidationErrors] = useState({})
    const [isClient, setIsClient] = useState(false)
    const [activeStep, setActiveStep] = useState(1)

    useEffect(() => {
        setIsClient(true)
    }, [])

    const requiredFields = {
        loan_type_name: 'Loan Type',
        loan_purpose_name: 'Loan Purpose',
        loan_amount_000s: 'Loan Amount',
        applicant_income_000s: 'Annual Income',
        property_type_name: 'Property Type',
        purchaser_type_name: 'Purchaser Type',
        owner_occupancy_name: 'Owner Occupancy',
        applicant_ethnicity_name: 'Ethnicity',
        preapproval_name: 'Pre-approval Status',
        lien_status_name: 'Lien Status',
        applicant_race_name_1: 'Race',
        applicant_sex_name: 'Sex',
        hud_median_family_income: 'HUD Median Family Income',
        tract_to_msamd_income: 'Tract to MSA/MD Income Ratio',
        number_of_owner_occupied_units: 'Owner Occupied Units',
        number_of_1_to_4_family_units: '1-4 Family Units'
    }

    const categoryOptions = {
        loan_type_name: ['Conventional', 'VA-guaranteed', 'FHA-insured', 'FSA/RHS-guaranteed'],
        
        loan_purpose_name: ['Home purchase', 'Refinancing', 'Home improvement'],
        
        property_type_name: [
            'One-to-four family dwelling (other than manufactured housing)',
            'Manufactured housing',
            'Multifamily dwelling'
        ],
        
        purchaser_type_name: [
            'Loan was not originated or was not sold in calendar year covered by register',
            'Ginnie Mae (GNMA)',
            'Fannie Mae (FNMA)',
            'Life insurance company, credit union, mortgage bank, or finance company',
            'Commercial bank, savings bank or savings association',
            'Freddie Mac (FHLMC)',
            'Affiliate institution',
            'Other type of purchaser',
            'Private securitization',
            'Farmer Mac (FAMC)'
        ],
        
        owner_occupancy_name: [
            'Owner-occupied as a principal dwelling',
            'Not owner-occupied as a principal dwelling',
            'Not applicable'
        ],
        
        applicant_ethnicity_name: [
            'Not Hispanic or Latino',
            'Hispanic or Latino',
            'Not applicable',
            'Information not provided by applicant in mail, Internet, or telephone application'
        ],
        
        preapproval_name: [
            'Preapproval was requested',
            'Preapproval was not requested',
            'Not applicable'
        ],
        
        lien_status_name: [
            'Secured by a first lien',
            'Secured by a subordinate lien',
            'Not applicable',
            'Not secured by a lien'
        ],
        
        applicant_race_name_1: [
            'American Indian or Alaska Native',
            'Asian',
            'Black or African American',
            'Native Hawaiian or Other Pacific Islander',
            'White',
            'Information not provided by applicant in mail, Internet, or telephone application',
            'Not applicable'
        ],
        
        applicant_sex_name: [
            'Male',
            'Female',
            'Not applicable',
            'Information not provided by applicant in mail, Internet, or telephone application'
        ]
    }

    const validateForm = () => {
        const errors = {}
        let isValid = true

        Object.keys(requiredFields).forEach(field => {
            if (!formData[field] || formData[field].toString().trim() === '') {
                errors[field] = `${requiredFields[field]} is required`
                isValid = false
            }
        })

        const numericFields = ['loan_amount_000s', 'applicant_income_000s', 'hud_median_family_income', 'tract_to_msamd_income', 'number_of_owner_occupied_units', 'number_of_1_to_4_family_units']
        
        numericFields.forEach(field => {
            if (formData[field]) {
                const value = parseFloat(formData[field])
                if (isNaN(value) || value < 0) {
                    errors[field] = `${requiredFields[field]} must be a positive number`
                    isValid = false
                }
                
                if (field === 'loan_amount_000s' && value > 10000) {
                    errors[field] = 'Loan amount seems unusually high (over $10M)'
                    isValid = false
                }
                
                if (field === 'applicant_income_000s' && value > 5000) {
                    errors[field] = 'Income seems unusually high (over $5M)'
                    isValid = false
                }
                
                if (field === 'tract_to_msamd_income' && (value < 0 || value > 300)) {
                    errors[field] = 'Tract to MSA/MD Income Ratio should be between 0 and 300'
                    isValid = false
                }
            }
        })

        setValidationErrors(errors)
        return isValid
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev }
                delete newErrors[name]
                return newErrors
            })
        }
        if (error) setError(null)
    }

    const predict = async () => {
        if (!validateForm()) {
            setError('Please fill in all required fields correctly')
            return
        }

        setIsLoading(true)
        setError(null)
        setPrediction(null)

        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ features: formData })
            })

            const responseText = await response.text()

            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`)
            }

            const result = JSON.parse(responseText)

            setTimeout(() => {
                setPrediction(result)
                setActiveStep(2)
            }, 1500)

        } catch (err) {
            console.error('Prediction failed:', err)
            setError(`Prediction failed: ${err.message}`)
        } finally {
            setTimeout(() => setIsLoading(false), 1500)
        }
    }

    const resetForm = () => {
        setFormData({
            loan_type_name: '',
            loan_purpose_name: '',
            loan_amount_000s: '',
            applicant_income_000s: '',
            property_type_name: '',
            purchaser_type_name: '',
            owner_occupancy_name: '',
            applicant_ethnicity_name: '',
            preapproval_name: '',
            lien_status_name: '',
            sequence_number: '1',
            number_of_owner_occupied_units: '',
            number_of_1_to_4_family_units: '',
            hud_median_family_income: '',
            tract_to_msamd_income: '',
            applicant_race_name_1: '',
            applicant_sex_name: ''
        })
        setPrediction(null)
        setError(null)
        setValidationErrors({})
        setActiveStep(1)
    }

    const renderSelectField = (name, options, label, icon) => (
        <div className="group">
            <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center">
                <span className="mr-2">{icon}</span>
                {label}
                <span className="text-red-400 ml-1">*</span>
            </label>
            <select
                name={name}
                value={formData[name]}
                onChange={handleInputChange}
                className={`w-full p-4 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 hover:bg-white/15 ${
                    validationErrors[name] 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-white/20 focus:ring-blue-500'
                }`}
                suppressHydrationWarning={true}
            >
                <option value="" className="bg-gray-800 text-gray-300">Select {label}</option>
                {Array.isArray(options) && options.map((option, idx) => (
                    <option key={idx} value={option} className="bg-gray-800 text-white">
                        {option}
                    </option>
                ))}
            </select>
            {validationErrors[name] && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {validationErrors[name]}
                </p>
            )}
        </div>
    )

    const renderInputField = (name, label, type = 'number', placeholder = '', icon) => (
        <div className="group">
            <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center">
                <span className="mr-2">{icon}</span>
                {label}
                <span className="text-red-400 ml-1">*</span>
            </label>
            <input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleInputChange}
                placeholder={placeholder}
                className={`w-full p-4 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 hover:bg-white/15 ${
                    validationErrors[name] 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-white/20 focus:ring-blue-500'
                }`}
                suppressHydrationWarning={true}
            />
            {validationErrors[name] && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                    </svg>
                    {validationErrors[name]}
                </p>
            )}
        </div>
    )

    if (!isClient) {
        return (
            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-white/20 rounded-lg mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array(8).fill(0).map((_, i) => (
                            <div key={i} className="h-20 bg-white/20 rounded-xl"></div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    const hasValidationErrors = Object.keys(validationErrors).length > 0

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-center space-x-4 mb-8">
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                    activeStep === 1 ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-300'
                }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activeStep === 1 ? 'bg-white text-blue-500' : 'bg-white/20'
                    }`}>
                        1
                    </div>
                    <span className="font-medium">Application Details</span>
                </div>
                <div className="w-8 h-0.5 bg-white/20"></div>
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${
                    activeStep === 2 ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-300'
                }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        activeStep === 2 ? 'bg-white text-green-500' : 'bg-white/20'
                    }`}>
                        2
                    </div>
                    <span className="font-medium">AI Analysis</span>
                </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-6 border-b border-white/10">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Loan Application Form</h2>
                            <p className="text-gray-300">Fill in your details for instant AI analysis</p>
                            <p className="text-gray-400 text-sm mt-1">
                                <span className="text-red-400">*</span> Required fields
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {renderSelectField('loan_type_name', categoryOptions.loan_type_name, 'Loan Type', '🏦')}
                        {renderSelectField('loan_purpose_name', categoryOptions.loan_purpose_name, 'Loan Purpose', '🎯')}
                        {renderInputField('loan_amount_000s', 'Loan Amount (thousands)', 'number', '250', '💰')}
                        {renderInputField('applicant_income_000s', 'Annual Income (thousands)', 'number', '85', '📊')}
                        {renderSelectField('property_type_name', categoryOptions.property_type_name, 'Property Type', '🏠')}
                        {renderSelectField('purchaser_type_name', categoryOptions.purchaser_type_name, 'Purchaser Type', '🏛️')}
                        {renderSelectField('owner_occupancy_name', categoryOptions.owner_occupancy_name, 'Owner Occupancy', '🔑')}
                        {renderSelectField('applicant_ethnicity_name', categoryOptions.applicant_ethnicity_name, 'Ethnicity', '👥')}
                        {renderSelectField('preapproval_name', categoryOptions.preapproval_name, 'Pre-approval Status', '✅')}
                        {renderSelectField('lien_status_name', categoryOptions.lien_status_name, 'Lien Status', '📋')}
                        {renderSelectField('applicant_race_name_1', categoryOptions.applicant_race_name_1, 'Race', '👤')}
                        {renderSelectField('applicant_sex_name', categoryOptions.applicant_sex_name, 'Sex', '⚧')}
                        {renderInputField('hud_median_family_income', 'HUD Median Family Income', 'number', '70', '🏘️')}
                        {renderInputField('tract_to_msamd_income', 'Tract to MSA/MD Income Ratio', 'number', '95.5', '📈')}
                        {renderInputField('number_of_owner_occupied_units', 'Owner Occupied Units', 'number', '1000', '🏘️')}
                        {renderInputField('number_of_1_to_4_family_units', '1-4 Family Units', 'number', '1200', '🏘️')}
                    </div>
                    
                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 backdrop-blur-sm">
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                                </svg>
                                <p className="text-red-200">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <button
                            onClick={predict}
                            disabled={isLoading || hasValidationErrors}
                            className={`flex-1 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:scale-100 disabled:shadow-none flex items-center justify-center space-x-3 ${
                                isLoading || hasValidationErrors
                                    ? 'bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                            }`}
                        >
                            {isLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>Analyzing with AI...</span>
                                </>
                            ) : hasValidationErrors ? (
                                <>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                                    </svg>
                                    <span>Please fix errors above</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <span>Get AI Prediction</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={resetForm}
                            className="px-8 py-4 border-2 border-white/20 text-white font-semibold rounded-xl hover:bg-white/10 transition-all duration-300 backdrop-blur-sm"
                        >
                            Reset Form
                        </button>
                    </div>

                    {isLoading && (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center space-x-4">
                                <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                                <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                            </div>
                            <p className="text-gray-300 mt-4 text-lg">AI is analyzing your application...</p>
                            <p className="text-gray-400 text-sm mt-2">Processing financial data and risk factors</p>
                        </div>
                    )}

                    {prediction && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="text-center mb-8">
                                <h3 className="text-3xl font-bold text-white mb-2">Analysis Complete!</h3>
                                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
                            </div>
                            
                            <div className={`relative overflow-hidden rounded-2xl p-8 ${
                                prediction.prediction === 'APPROVED' 
                                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30' 
                                    : 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30'
                            }`}>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h4 className={`text-4xl font-bold mb-2 ${
                                            prediction.prediction === 'APPROVED' ? 'text-green-400' : 'text-red-400'
                                        }`}>
                                            {prediction.prediction}
                                        </h4>
                                        <p className="text-white/80 text-lg">Confidence: {prediction.confidence}%</p>
                                        <p className="text-white/60">
                                            Approval Probability: {(prediction.probability * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl ${
                                        prediction.prediction === 'APPROVED' ? 'bg-green-500/30' : 'bg-red-500/30'
                                    }`}>
                                        {prediction.prediction === 'APPROVED' ? '✅' : '❌'}
                                    </div>
                                </div>
                                
                                <div className="bg-white/10 rounded-full h-3 mb-4">
                                    <div 
                                        className={`h-full rounded-full transition-all duration-1000 ${
                                            prediction.prediction === 'APPROVED' 
                                                ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                                                : 'bg-gradient-to-r from-red-400 to-orange-500'
                                        }`}
                                        style={{width: `${prediction.probability * 100}%`}}
                                    ></div>
                                </div>
                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
