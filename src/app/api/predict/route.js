import fs from 'fs';
import path from 'path';

let modelData = null;

async function loadModelData() {
    if (!modelData) {
        try {
            const dataPath = path.join(process.cwd(), 'public', 'model_data.json');
            if (!fs.existsSync(dataPath)) {
                throw new Error(`Model data file not found at: ${dataPath}`);
            }
            const rawData = fs.readFileSync(dataPath, 'utf8');
            modelData = JSON.parse(rawData);
            console.log('Model data loaded successfully');
        } catch (error) {
            console.error('Failed to load model data:', error);
            throw new Error(`Model data loading failed: ${error.message}`);
        }
    }
}

export async function POST(request) {
    try {
        await loadModelData();
        const { features } = await request.json();

        if (!features) {
            return Response.json(
                { error: 'Missing features in request body' },
                { status: 400 }
            );
        }

        const result = await predictWithWeights(features);
        return Response.json(result);

    } catch (error) {
        console.error('API Error:', error);
        return Response.json(
            {
                error: 'Prediction failed',
                details: error.message
            },
            { status: 500 }
        );
    }
}

function preprocessFeatures(features) {
    const processed = new Array(modelData.feature_names.length).fill(0);

    // Handle numerical features
    const numericalFeatures = [
        'loan_amount_000s', 'applicant_income_000s', 'sequence_number',
        'number_of_owner_occupied_units', 'number_of_1_to_4_family_units',
        'hud_median_family_income', 'tract_to_msamd_income'
    ];

    numericalFeatures.forEach(feature => {
        const idx = modelData.feature_names.indexOf(feature);
        if (idx !== -1 && features[feature]) {
            processed[idx] = parseFloat(features[feature]);
        }
    });

    // Handle categorical features (one-hot encoding)
    const categoricalMappings = {
        'loan_type_name': features.loan_type_name,
        'loan_purpose_name': features.loan_purpose_name,
        'property_type_name': features.property_type_name,
        'purchaser_type_name': features.purchaser_type_name,
        'owner_occupancy_name': features.owner_occupancy_name,
        'applicant_ethnicity_name': features.applicant_ethnicity_name,
        'preapproval_name': features.preapproval_name,
        'lien_status_name': features.lien_status_name,
        'applicant_race_name_1': features.applicant_race_name_1,  // Updated to use name version
        'applicant_sex_name': features.applicant_sex_name
    };

    Object.entries(categoricalMappings).forEach(([prefix, value]) => {
        if (value) {
            const featureName = `${prefix}_${value}`;
            const idx = modelData.feature_names.indexOf(featureName);
            if (idx !== -1) {
                processed[idx] = 1;
            }
        }
    });

    // Apply scaling: (value - mean) / scale
    return processed.map((value, i) => {
        return (value - modelData.scaler_mean[i]) / modelData.scaler_scale[i];
    });
}

function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

async function predictWithWeights(features) {
    try {
        const processedFeatures = preprocessFeatures(features);

        // Calculate linear combination: weights * features + bias
        let linearScore = modelData.bias;
        for (let i = 0; i < processedFeatures.length; i++) {
            linearScore += modelData.weights[i] * processedFeatures[i];
        }

        // Apply sigmoid to get probability
        const probability = sigmoid(linearScore);
        const prediction = probability > 0.5 ? 'APPROVED' : 'REJECTED';

        const result = {
            probability: parseFloat(probability.toFixed(4)),
            prediction: prediction,
            confidence: parseFloat((Math.max(probability, 1 - probability) * 100).toFixed(1))
        };

        if (prediction === 'REJECTED') {
            result.explanations = explainRejection(processedFeatures);
            result.suggestions = generateSuggestions(result.explanations);
        } else {
            // Show positive factors for approved loans
            const contributions = modelData.weights.map((weight, i) => weight * processedFeatures[i]);
            const indexed = contributions.map((contrib, i) => ({
                contribution: contrib,
                feature: modelData.feature_names[i]
            }));

            result.positive_factors = indexed
                .sort((a, b) => b.contribution - a.contribution)
                .slice(0, 3)
                .map(item => ({
                    feature: item.feature,
                    contribution: item.contribution.toFixed(3)
                }));
        }

        return result;
    } catch (error) {
        throw new Error(`Prediction calculation failed: ${error.message}`);
    }
}

function explainRejection(inputValues) {
    const contributions = modelData.weights.map((weight, i) => weight * inputValues[i]);
    const indexed = contributions.map((contrib, i) => ({
        index: i,
        contribution: contrib,
        feature: modelData.feature_names[i],
        value: inputValues[i]
    }));

    const worstFactors = indexed.sort((a, b) => a.contribution - b.contribution).slice(0, 5);

    return worstFactors.map(factor => ({
        feature: factor.feature,
        contribution: factor.contribution.toFixed(3),
        reason: getReasonForFeature(factor.feature, factor.value)
    }));
}

function generateSuggestions(explanations) {
    const suggestions = [];

    explanations.forEach(explanation => {
        const suggestion = getSuggestionForFeature(explanation.feature);
        if (suggestion) {
            suggestions.push(suggestion);
        }
    });

    // Add general suggestions
    suggestions.push({
        category: "Income",
        action: "Increase your annual income",
        details: "Consider additional income sources, part-time work, or skill development",
        priority: "High",
        timeline: "3-6 months"
    });

    suggestions.push({
        category: "Credit",
        action: "Improve your credit profile",
        details: "Pay down existing debts and maintain good payment history",
        priority: "High",
        timeline: "6-12 months"
    });

    return suggestions.slice(0, 5);
}

function getReasonForFeature(featureName, value) {
    if (featureName.includes('applicant_income_000s')) {
        return 'Income level may be insufficient for the requested loan amount';
    } else if (featureName.includes('loan_amount_000s')) {
        return 'Requested loan amount is high relative to qualifications';
    } else if (featureName.includes('owner_occupancy_name_Not owner-occupied')) {
        return 'Investment properties have stricter lending requirements';
    } else if (featureName.includes('preapproval_name_Preapproval was not requested')) {
        return 'Not requesting preapproval weakens your application';
    } else if (featureName.includes('property_type_name_Manufactured housing')) {
        return 'Manufactured housing has lower approval rates than single-family homes';
    } else if (featureName.includes('applicant_race_name_1')) {
        return 'Demographic factors may influence lending patterns in historical data';
    } else if (featureName.includes('purchaser_type_name')) {
        return 'This purchaser type may have different approval criteria';
    } else {
        return 'This factor negatively impacts your approval chances';
    }
}

function getSuggestionForFeature(featureName) {
    if (featureName.includes('applicant_income_000s')) {
        return {
            category: "Income",
            action: "Increase your annual income",
            details: "Consider additional income sources or career advancement",
            priority: "High"
        };
    } else if (featureName.includes('loan_amount_000s')) {
        return {
            category: "Loan Amount",
            action: "Reduce the loan amount requested",
            details: "Consider a smaller loan or increase your down payment",
            priority: "High"
        };
    } else if (featureName.includes('owner_occupancy_name_Not owner-occupied')) {
        return {
            category: "Property Usage",
            action: "Consider owner-occupied properties",
            details: "Owner-occupied properties have better approval rates",
            priority: "Medium"
        };
    } else if (featureName.includes('preapproval_name_Preapproval was not requested')) {
        return {
            category: "Pre-approval",
            action: "Get pre-approved before applying",
            details: "Pre-approval demonstrates you're a qualified buyer",
            priority: "High"
        };
    } else if (featureName.includes('property_type_name_Manufactured housing')) {
        return {
            category: "Property Type",
            action: "Consider single-family homes",
            details: "Traditional single-family homes have higher approval rates",
            priority: "Medium"
        };
    } else if (featureName.includes('purchaser_type_name')) {
        return {
            category: "Loan Program",
            action: "Consider different loan programs",
            details: "Some loan programs may have better approval rates for your profile",
            priority: "Medium"
        };
    }
    return null;
}
