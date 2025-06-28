'use client'
import { useState, useEffect } from 'react'

export default function LoanPredictor() {
    const [prediction, setPrediction] = useState(null)
    const [formData, setFormData] = useState({
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
                className={`w-full p-4 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 hover:bg-white/15 ${validationErrors[name]
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
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
                className={`w-full p-4 bg-white/10 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-300 hover:bg-white/15 ${validationErrors[name]
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-white/20 focus:ring-blue-500'
                    }`}
                suppressHydrationWarning={true}
            />
            {validationErrors[name] && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${activeStep === 1 ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-300'
                    }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStep === 1 ? 'bg-white text-blue-500' : 'bg-white/20'
                        }`}>
                        1
                    </div>
                    <span className="font-medium">Application Details</span>
                </div>
                <div className="w-8 h-0.5 bg-white/20"></div>
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 ${activeStep === 2 ? 'bg-green-500 text-white' : 'bg-white/10 text-gray-300'
                    }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStep === 2 ? 'bg-white text-green-500' : 'bg-white/20'
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
                                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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

                    {hasValidationErrors && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 backdrop-blur-sm">
                            <div className="flex items-start space-x-2">
                                <svg className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <div>
                                    <p className="text-red-200 font-medium mb-2">Please fix the following errors:</p>
                                    <ul className="text-red-300 text-sm space-y-1">
                                        {Object.values(validationErrors).map((error, index) => (
                                            <li key={index}>• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 mb-6 backdrop-blur-sm">
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                <p className="text-red-200">{error}</p>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <button
                            onClick={predict}
                            disabled={isLoading || hasValidationErrors}
                            className={`flex-1 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl disabled:scale-100 disabled:shadow-none flex items-center justify-center space-x-3 ${isLoading || hasValidationErrors
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
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <span>Please fix errors above</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
                                <div className="w-3 h-3 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-3 h-3 bg-pink-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                            <p className="text-gray-300 mt-4 text-lg">AI is analyzing your application...</p>
                            <p className="text-gray-400 text-sm mt-2">Computing dynamic SHAP and LIME explanations...</p>
                        </div>
                    )}

                    {prediction && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl p-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                                        <span className="text-cyan-200 font-semibold">Dynamic AI Explanations</span>
                                    </div>
                                    <div className="text-right">
                                        {prediction.computed_at && (
                                            <div className="text-cyan-300 text-xs">
                                                Computed: {new Date(prediction.computed_at).toLocaleTimeString()}
                                            </div>
                                        )}
                                        <div className="text-cyan-400 text-xs font-mono">
                                            Type: {prediction.explanation_type || 'DYNAMIC'}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-cyan-300/80 text-sm mt-2">
                                    🔄 Fresh explanations computed specifically for your application
                                </p>
                            </div>

                            <div className="text-center mb-8">
                                <h3 className="text-3xl font-bold text-white mb-2">Analysis Complete!</h3>
                                <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
                            </div>

                            <div className={`relative overflow-hidden rounded-2xl p-8 ${prediction.prediction === 'APPROVED'
                                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30'
                                    : 'bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30'
                                }`}>
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h4 className={`text-4xl font-bold mb-2 ${prediction.prediction === 'APPROVED' ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                            {prediction.prediction}
                                        </h4>
                                        <p className="text-white/80 text-lg">Confidence: {prediction.confidence}%</p>
                                        <p className="text-white/60">
                                            Approval Probability: {(prediction.probability * 100).toFixed(1)}%
                                        </p>
                                    </div>
                                    <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl ${prediction.prediction === 'APPROVED' ? 'bg-green-500/30' : 'bg-red-500/30'
                                        }`}>
                                        {prediction.prediction === 'APPROVED' ? '✅' : '❌'}
                                    </div>
                                </div>

                                <div className="bg-white/10 rounded-full h-3 mb-4">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${prediction.prediction === 'APPROVED'
                                                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                                : 'bg-gradient-to-r from-red-400 to-orange-500'
                                            }`}
                                        style={{ width: `${prediction.probability * 100}%` }}
                                    ></div>
                                </div>
                            </div>

                            {prediction.explanations && prediction.explanations.length > 0 && (
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                    <h4 className="font-bold text-yellow-400 mb-4 flex items-center text-xl">
                                        <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Key Rejection Factors
                                    </h4>
                                    <div className="space-y-3">
                                        {prediction.explanations.map((exp, i) => (
                                            <div key={i} className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
                                                <div className="flex items-start space-x-3">
                                                    <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                                                        <span className="text-yellow-400 font-bold text-sm">{i + 1}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-yellow-200 font-medium">{exp.reason}</p>
                                                        <p className="text-yellow-300/60 text-sm mt-1">
                                                            Feature: {exp.feature} (Impact: {exp.contribution})
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {prediction.shap_explanations && prediction.shap_explanations.length > 0 && (
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                    <h4 className="font-bold text-purple-400 mb-4 flex items-center text-xl">
                                        <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                        SHAP Feature Importance Analysis
                                    </h4>
                                    <p className="text-gray-300 text-sm mb-4">
                                        SHAP values show each feature's contribution to the final prediction with interaction effects
                                    </p>
                                    <div className="space-y-3">
                                        {prediction.shap_explanations.map((item, i) => (
                                            <div key={i} className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-purple-200 font-medium text-sm">
                                                        {item.feature.replace(/_/g, ' ').replace(/name/g, '').trim()}
                                                    </span>
                                                    <div className="flex items-center space-x-2">
                                                        <span className={`text-xs px-2 py-1 rounded-full font-mono ${parseFloat(item.shap_value) > 0
                                                                ? 'bg-green-500/20 text-green-300'
                                                                : 'bg-red-500/20 text-red-300'
                                                            }`}>
                                                            {parseFloat(item.shap_value) > 0 ? '+' : ''}{item.shap_value}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mb-2">
                                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                                        <div
                                                            className={`h-2 rounded-full transition-all duration-500 ${parseFloat(item.shap_value) > 0
                                                                    ? 'bg-gradient-to-r from-green-400 to-green-500'
                                                                    : 'bg-gradient-to-r from-red-400 to-red-500'
                                                                }`}
                                                            style={{
                                                                width: `${Math.min(Math.abs(parseFloat(item.shap_value)) * 300, 100)}%`
                                                            }}
                                                        ></div>
                                                    </div>
                                                </div>
                                                <p className="text-purple-300/80 text-xs">{item.explanation || 'Feature contribution to prediction'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {prediction.lime_explanations && prediction.lime_explanations.length > 0 && (
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                    <h4 className="font-bold text-orange-400 mb-4 flex items-center text-xl">
                                        <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 1.414L15.657 9.17a1 1 0 11-1.414-1.414l1.414-1.414zm2.121 2.121a1 1 0 011.414 1.414l-2.121 2.121a1 1 0 11-1.414-1.414l2.121-2.121z" clipRule="evenodd" />
                                        </svg>
                                        LIME Local Interpretability
                                    </h4>
                                    <p className="text-gray-300 text-sm mb-4">
                                        LIME explains prediction sensitivity - how changes to each feature would affect your specific case
                                    </p>
                                    <div className="space-y-3">
                                        {prediction.lime_explanations.map((item, i) => (
                                            <div key={i} className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex-1">
                                                        <span className="text-orange-200 font-medium text-sm block">
                                                            {item.feature.replace(/_/g, ' ').replace(/name/g, '').trim()}
                                                        </span>
                                                        <span className="text-orange-300/80 text-xs mt-1 block">
                                                            {item.local_influence}
                                                        </span>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-orange-300 text-xs font-mono block">
                                                            Sensitivity: {item.lime_importance}
                                                        </span>
                                                        <span className="text-orange-400/60 text-xs">
                                                            Impact: {item.contribution}
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-orange-300/70 text-xs mt-2">{item.explanation || 'Local feature sensitivity'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {prediction.suggestions && prediction.suggestions.length > 0 && (
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                    <h4 className="font-bold text-blue-400 mb-4 flex items-center text-xl">
                                        <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                        Improvement Recommendations
                                    </h4>
                                    <div className="space-y-4">
                                        {prediction.suggestions.map((sug, i) => (
                                            <div key={i} className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                                                <div className="flex items-start space-x-3">
                                                    <div className={`px-3 py-1 text-xs font-bold rounded-full ${sug.priority === 'High'
                                                            ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                            : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                                        }`}>
                                                        {sug.priority}
                                                    </div>
                                                    <div className="flex-1">
                                                        <h5 className="font-semibold text-blue-200 mb-1">{sug.action}</h5>
                                                        <p className="text-blue-300/80 text-sm mb-2">{sug.details}</p>
                                                        {sug.timeline && (
                                                            <div className="flex items-center space-x-2">
                                                                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                </svg>
                                                                <span className="text-blue-400 text-xs">{sug.timeline}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {prediction.positive_factors && prediction.positive_factors.length > 0 && (
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                    <h4 className="font-bold text-green-400 mb-4 flex items-center text-xl">
                                        <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Strengths That Helped
                                    </h4>
                                    <div className="space-y-3">
                                        {prediction.positive_factors.map((factor, i) => (
                                            <div key={i} className="flex items-center space-x-3 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
                                                <div className="w-3 h-3 bg-green-400 rounded-full flex-shrink-0"></div>
                                                <span className="text-green-200 flex-1">{factor.feature}</span>
                                                <span className="text-green-300 text-sm font-mono">+{factor.contribution}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {prediction.feature_importance_summary && (
                                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                    <h4 className="font-bold text-cyan-400 mb-4 flex items-center text-xl">
                                        <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                                        </svg>
                                        AI Explainability Summary
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {prediction.feature_importance_summary.top_positive && prediction.feature_importance_summary.top_positive.length > 0 && (
                                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                                                <h5 className="text-green-400 font-semibold text-sm mb-2">Strongest Positive Factors</h5>
                                                <div className="space-y-1">
                                                    {prediction.feature_importance_summary.top_positive.map((factor, i) => (
                                                        <div key={i} className="text-green-300 text-xs">
                                                            • {factor.feature.replace(/_/g, ' ').replace(/name/g, '').trim()}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {prediction.feature_importance_summary.top_negative && prediction.feature_importance_summary.top_negative.length > 0 && (
                                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                                                <h5 className="text-red-400 font-semibold text-sm mb-2">Strongest Negative Factors</h5>
                                                <div className="space-y-1">
                                                    {prediction.feature_importance_summary.top_negative.map((factor, i) => (
                                                        <div key={i} className="text-red-300 text-xs">
                                                            • {factor.feature.replace(/_/g, ' ').replace(/name/g, '').trim()}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {prediction.feature_importance_summary.most_sensitive && prediction.feature_importance_summary.most_sensitive.length > 0 && (
                                            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                                                <h5 className="text-orange-400 font-semibold text-sm mb-2">Most Sensitive Features</h5>
                                                <div className="space-y-1">
                                                    {prediction.feature_importance_summary.most_sensitive.map((factor, i) => (
                                                        <div key={i} className="text-orange-300 text-xs">
                                                            • {factor.feature.replace(/_/g, ' ').replace(/name/g, '').trim()}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    )
}
