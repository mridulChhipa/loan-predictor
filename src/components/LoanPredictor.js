// components/LoanPredictor.js
import { InferenceSession, Tensor } from 'onnxruntime-web';
import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, ClockIcon, CreditCardIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

export default function LoanPredictor() {
    const [session, setSession] = useState(null);
    const [modelInfo, setModelInfo] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [formData, setFormData] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [isModelLoading, setIsModelLoading] = useState(true);
    const [validationError, setValidationError] = useState(null);

    const featureLabels = {
        'loan_type': 'Loan Type',
        'loan_purpose': 'Loan Purpose',
        'loan_amount_000s': 'Loan Amount ($000s)',
        'applicant_income_000s': 'Annual Income ($000s)',
        'property_type': 'Property Type',
        'purchaser_type': 'Purchaser Type',
        'owner_occupancy': 'Owner Occupancy',
        'applicant_ethnicity': 'Applicant Ethnicity',
        'preapproval': 'Preapproval Status',
        'lien_status': 'Lien Status',
        'msamd': 'MSA/MD Code',
        'sequence_number': 'Sequence Number',
        'number_of_owner_occupied_units': 'Owner Occupied Units',
        'number_of_1_to_4_family_units': '1-4 Family Units',
        'hud_median_family_income': 'HUD Median Family Income',
        'tract_to_msamd_income': 'Tract to MSA Income Ratio',
        'applicant_race_1': 'Applicant Race',
        'applicant_sex': 'Applicant Gender'
    };

    useEffect(() => {
        async function loadModel() {
            try {
                const modelSession = await InferenceSession.create('/loan_model.onnx');
                setSession(modelSession);

                const response = await fetch('/model_info.json');
                const info = await response.json();
                setModelInfo(info);
                setIsModelLoading(false);
            } catch (error) {
                console.error('Failed to load model:', error);
                setIsModelLoading(false);
            }
        }
        loadModel();
    }, []);

    // Validation function
    const validateInputs = () => {
        if (!modelInfo) return { isValid: false, errors: ['Model not loaded'] };

        const missingFields = [];
        const invalidFields = [];

        for (const feature of modelInfo.feature_names) {
            const value = formData[feature];

            if (!value || value.trim() === '') {
                missingFields.push(featureLabels[feature] || feature);
            } else if (isNaN(parseFloat(value))) {
                invalidFields.push(featureLabels[feature] || feature);
            }
        }

        const errors = [];
        if (missingFields.length > 0) {
            errors.push(`Missing required fields: ${missingFields.slice(0, 3).join(', ')}${missingFields.length > 3 ? ` and ${missingFields.length - 3} more` : ''}`);
        }
        if (invalidFields.length > 0) {
            errors.push(`Invalid numeric values in: ${invalidFields.slice(0, 3).join(', ')}${invalidFields.length > 3 ? ` and ${invalidFields.length - 3} more` : ''}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            missingCount: missingFields.length,
            invalidCount: invalidFields.length
        };
    };

    const standardizeFeatures = (rawValues) => {
        if (!modelInfo) return rawValues;
        return rawValues.map((value, i) => {
            return (value - modelInfo.scaler_mean[i]) / modelInfo.scaler_scale[i];
        });
    };

    const explainRejection = (inputValues) => {
        if (!modelInfo) return [];
        const contribs = modelInfo.weights.map((w, i) => w * inputValues[i]);
        const indexed = contribs.map((contrib, i) => ({ index: i, contrib }));
        const sorted = indexed.sort((a, b) => a.contrib - b.contrib);
        const worst3 = sorted.slice(0, 3);

        return worst3.map(item => ({
            feature: modelInfo.feature_names[item.index],
            contribution: item.contrib.toFixed(3)
        }));
    };

    const predict = async () => {
        if (!session || !modelInfo) return;

        // Clear previous results
        setPrediction(null);
        setValidationError(null);

        // Validate inputs
        const validation = validateInputs();
        if (!validation.isValid) {
            setValidationError(validation);
            return;
        }

        setIsLoading(true);

        try {
            const rawValues = modelInfo.feature_names.map(name =>
                parseFloat(formData[name]) || 0
            );

            const standardizedValues = standardizeFeatures(rawValues);
            const inputTensor = new Tensor('float32', standardizedValues, [1, standardizedValues.length]);
            const results = await session.run({ input: inputTensor });
            const probability = results.output.data[0];
            const prediction = probability > 0.5 ? 1 : 0;

            const result = {
                probability: probability.toFixed(3),
                prediction: prediction === 1 ? 'APPROVED' : 'REJECTED',
                explanation: []
            };

            if (prediction === 0) {
                result.explanation = explainRejection(standardizedValues);
            }

            setPrediction(result);
        } catch (error) {
            console.error('Prediction failed:', error);
            setValidationError({
                isValid: false,
                errors: ['Prediction failed. Please check your inputs and try again.'],
                missingCount: 0,
                invalidCount: 0
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (feature, value) => {
        setFormData(prev => ({
            ...prev,
            [feature]: value
        }));
        // Clear validation error when user starts typing
        if (validationError) {
            setValidationError(null);
        }
    };

    const resetForm = () => {
        setFormData({});
        setPrediction(null);
        setValidationError(null);
    };

    // Calculate completion percentage
    const getCompletionPercentage = () => {
        if (!modelInfo) return 0;
        const totalFields = modelInfo.feature_names.length;
        const filledFields = modelInfo.feature_names.filter(name =>
            formData[name] && formData[name].trim() !== ''
        ).length;
        return Math.round((filledFields / totalFields) * 100);
    };

    if (isModelLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <ClockIcon className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
                    <h2 className="text-2xl font-semibold text-gray-800">Loading AI Model...</h2>
                    <p className="text-gray-600 mt-2">Please wait while we prepare your loan predictor</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <CreditCardIcon className="h-10 w-10 text-blue-600" />
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900">AI Loan Predictor</h1>
                                <p className="text-gray-600">Instant loan approval predictions with AI</p>
                            </div>
                        </div>
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                            Reset Form
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Form Section */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Loan Application Details</h2>
                                <div className="text-sm text-gray-600">
                                    Progress: {getCompletionPercentage()}% complete
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                                <div
                                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${getCompletionPercentage()}%` }}
                                ></div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {modelInfo?.feature_names.map(feature => (
                                    <div key={feature} className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            {featureLabels[feature] || feature}
                                            <span className="text-red-500 ml-1">*</span>
                                        </label>
                                        <input
                                            type="number"
                                            step="any"
                                            value={formData[feature] || ''}
                                            onChange={(e) => handleInputChange(feature, e.target.value)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-white"
                                            placeholder="Enter value"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 flex justify-center">
                                <button
                                    onClick={predict}
                                    disabled={isLoading || !session}
                                    className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 shadow-lg"
                                >
                                    {isLoading ? (
                                        <>
                                            <ClockIcon className="h-5 w-5 animate-spin inline mr-2" />
                                            Analyzing...
                                        </>
                                    ) : (
                                        'Predict Loan Decision'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Prediction Results</h2>

                            {/* Validation Error Display */}
                            {validationError && (
                                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
                                    <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-red-800 mb-3">Input Required</h3>
                                    <div className="space-y-2">
                                        {validationError.errors.map((error, index) => (
                                            <p key={index} className="text-sm text-red-700">{error}</p>
                                        ))}
                                    </div>
                                    <div className="mt-4 p-3 bg-red-100 rounded-lg">
                                        <p className="text-sm text-red-600">
                                            Please fill in all {modelInfo?.feature_names.length} required fields to get your loan prediction.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Loading State */}
                            {isLoading && (
                                <div className="text-center py-12">
                                    <ClockIcon className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
                                    <p className="text-gray-600">Analyzing your application...</p>
                                </div>
                            )}

                            {/* Default State */}
                            {!prediction && !validationError && !isLoading && (
                                <div className="text-center py-12">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CreditCardIcon className="h-12 w-12 text-gray-400" />
                                    </div>
                                    <p className="text-gray-500">Fill out the form and click predict to see results</p>
                                    <div className="mt-4 text-sm text-gray-400">
                                        {getCompletionPercentage()}% of fields completed
                                    </div>
                                </div>
                            )}

                            {/* Prediction Results */}
                            {prediction && !validationError && (
                                <div className="space-y-6">
                                    {/* Decision Badge */}
                                    <div className={`p-6 rounded-xl border-2 text-center ${prediction.prediction === 'APPROVED'
                                            ? 'border-green-200 bg-green-50'
                                            : 'border-red-200 bg-red-50'
                                        }`}>
                                        <div className="flex items-center justify-center mb-3">
                                            {prediction.prediction === 'APPROVED' ? (
                                                <CheckCircleIcon className="h-12 w-12 text-green-600" />
                                            ) : (
                                                <XCircleIcon className="h-12 w-12 text-red-600" />
                                            )}
                                        </div>
                                        <h3 className={`text-2xl font-bold ${prediction.prediction === 'APPROVED' ? 'text-green-800' : 'text-red-800'
                                            }`}>
                                            {prediction.prediction}
                                        </h3>
                                        <p className="text-gray-600 mt-1">
                                            Confidence: {(parseFloat(prediction.probability) * 100).toFixed(1)}%
                                        </p>
                                    </div>

                                    {/* Probability Bar */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm text-gray-600">
                                            <span>Approval Probability</span>
                                            <span>{(parseFloat(prediction.probability) * 100).toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3">
                                            <div
                                                className={`h-3 rounded-full transition-all duration-500 ${parseFloat(prediction.probability) > 0.5
                                                        ? 'bg-gradient-to-r from-green-400 to-green-600'
                                                        : 'bg-gradient-to-r from-red-400 to-red-600'
                                                    }`}
                                                style={{ width: `${parseFloat(prediction.probability) * 100}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {/* Rejection Reasons */}
                                    {prediction.explanation.length > 0 && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-red-800 mb-3">Key Rejection Factors:</h4>
                                            <ul className="space-y-2">
                                                {prediction.explanation.map((reason, i) => (
                                                    <li key={i} className="text-sm text-red-700 flex items-start">
                                                        <span className="w-2 h-2 bg-red-400 rounded-full mt-1.5 mr-3 flex-shrink-0"></span>
                                                        <div>
                                                            <span className="font-medium">{featureLabels[reason.feature]}</span>
                                                            <span className="text-red-600 ml-1">({reason.contribution})</span>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
