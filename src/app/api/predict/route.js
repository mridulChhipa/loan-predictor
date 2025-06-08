import fs from 'fs';
import path from 'path';

let modelData = null;
let dynamicExplainers = null;

async function loadModelData() {
    if (!modelData) {
        try {
            const dataPath = path.join(process.cwd(), 'public', 'model_data.json');
            const rawData = fs.readFileSync(dataPath, 'utf8');
            modelData = JSON.parse(rawData);
            console.log('✅ Model data loaded for dynamic explanations');
        } catch (error) {
            throw new Error(`Model data loading failed: ${error.message}`);
        }
    }
}

function initializeDynamicExplainers() {
    if (!dynamicExplainers && modelData) {
        dynamicExplainers = {
            shap: {
                background: modelData.background_data,
                initialized: true
            },
            lime: {
                featureNames: modelData.feature_names,
                initialized: true
            }
        };
        console.log('✅ Dynamic explainers initialized');
    }
}

export async function POST(request) {
    try {
        await loadModelData();
        initializeDynamicExplainers();

        const { features } = await request.json();

        if (!features) {
            return Response.json(
                { error: 'Missing features in request body' },
                { status: 400 }
            );
        }

        const result = await computeDynamicPredictionWithExplanations(features);
        return Response.json(result);

    } catch (error) {
        console.error('API Error:', error);
        return Response.json(
            { error: 'Prediction failed', details: error.message },
            { status: 500 }
        );
    }
}

function preprocessFeatures(features) {
    const processed = new Array(modelData.feature_names.length).fill(0);

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

    const categoricalMappings = {
        'loan_type_name': features.loan_type_name,
        'loan_purpose_name': features.loan_purpose_name,
        'property_type_name': features.property_type_name,
        'purchaser_type_name': features.purchaser_type_name,
        'owner_occupancy_name': features.owner_occupancy_name,
        'applicant_ethnicity_name': features.applicant_ethnicity_name,
        'preapproval_name': features.preapproval_name,
        'lien_status_name': features.lien_status_name,
        'applicant_race_name_1': features.applicant_race_name_1,
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

    return processed.map((value, i) => {
        return (value - modelData.scaler_mean[i]) / modelData.scaler_scale[i];
    });
}

function sigmoid(x) {
    return 1 / (1 + Math.exp(-x));
}

function computeDynamicSHAP(processedFeatures) {
    console.log('🔄 Computing SHAP explanations dynamically...');

    const baseline = dynamicExplainers.shap.background;
    const shapValues = [];

    for (let i = 0; i < processedFeatures.length; i++) {
        let marginalContribution = 0;
        const numSamples = 20;

        for (let sample = 0; sample < numSamples; sample++) {
            const bgIdx = Math.floor(Math.random() * baseline.length);
            const background = baseline[bgIdx];

            const coalitionWithout = [...processedFeatures];
            coalitionWithout[i] = background[i];
            const predWithout = computeModelPrediction(coalitionWithout);

            const coalitionWith = [...processedFeatures];
            const predWith = computeModelPrediction(coalitionWith);

            marginalContribution += (predWith - predWithout);
        }

        shapValues.push({
            feature: modelData.feature_names[i],
            shap_value: (marginalContribution / numSamples).toFixed(4),
            feature_value: processedFeatures[i].toFixed(3),
            impact: marginalContribution > 0 ? 'Positive' : 'Negative',
            abs_importance: Math.abs(marginalContribution / numSamples)
        });
    }

    return shapValues
        .sort((a, b) => b.abs_importance - a.abs_importance)
        .slice(0, 8)
        .map(item => ({
            ...item,
            explanation: `This feature ${item.impact.toLowerCase()}ly affects the prediction with strength ${Math.abs(parseFloat(item.shap_value)).toFixed(3)}`
        }));
}

function computeDynamicLIME(processedFeatures) {
    console.log('🔄 Computing LIME explanations dynamically...');

    const originalPred = computeModelPrediction(processedFeatures);
    const limeExplanations = [];
    const numPerturbations = 50; // Reduced for web performance

    for (let featureIdx = 0; featureIdx < processedFeatures.length; featureIdx++) {
        let sensitivitySum = 0;

        for (let p = 0; p < numPerturbations; p++) {
            // Create perturbation
            const perturbedFeatures = [...processedFeatures];
            const noise = (Math.random() - 0.5) * 0.2; // 20% noise
            perturbedFeatures[featureIdx] += noise;

            const perturbedPred = computeModelPrediction(perturbedFeatures);
            const featureDiff = Math.abs(noise);
            const predDiff = Math.abs(perturbedPred - originalPred);

            if (featureDiff > 0) {
                sensitivitySum += predDiff / featureDiff;
            }
        }

        const avgSensitivity = sensitivitySum / numPerturbations;
        const contribution = modelData.weights[featureIdx] * processedFeatures[featureIdx];

        limeExplanations.push({
            feature: modelData.feature_names[featureIdx],
            lime_importance: avgSensitivity.toFixed(4),
            contribution: contribution.toFixed(4),
            local_influence: contribution > 0 ? 'Increases approval chance' : 'Decreases approval chance',
            abs_importance: avgSensitivity
        });
    }

    return limeExplanations
        .sort((a, b) => b.abs_importance - a.abs_importance)
        .slice(0, 6)
        .map(item => ({
            ...item,
            explanation: `High sensitivity feature - small changes have ${item.abs_importance > 0.1 ? 'significant' : 'moderate'} impact on prediction`
        }));
}

function computeModelPrediction(processedFeatures) {
    let linearScore = modelData.bias;
    for (let i = 0; i < processedFeatures.length; i++) {
        linearScore += modelData.weights[i] * processedFeatures[i];
    }
    return sigmoid(linearScore);
}

async function computeDynamicPredictionWithExplanations(features) {
    try {
        console.log('🚀 Starting dynamic prediction with fresh explanations...');

        const processedFeatures = preprocessFeatures(features);
        const probability = computeModelPrediction(processedFeatures);
        const prediction = probability > 0.5 ? 'APPROVED' : 'REJECTED';

        const result = {
            probability: parseFloat(probability.toFixed(4)),
            prediction: prediction,
            confidence: parseFloat((Math.max(probability, 1 - probability) * 100).toFixed(1)),
            explanation_type: 'DYNAMIC',
            computed_at: new Date().toISOString()
        };

        if (prediction === 'REJECTED') {
            result.explanations = explainRejection(processedFeatures);
            result.suggestions = generateSuggestions(result.explanations);
        } else {
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

        result.shap_explanations = computeDynamicSHAP(processedFeatures);

        result.lime_explanations = computeDynamicLIME(processedFeatures);

        result.feature_importance_summary = {
            top_positive: result.shap_explanations
                .filter(item => item.impact === 'Positive')
                .slice(0, 3),
            top_negative: result.shap_explanations
                .filter(item => item.impact === 'Negative')
                .slice(0, 3),
            most_sensitive: result.lime_explanations.slice(0, 3)
        };

        console.log('✅ Dynamic explanations computed successfully');
        return result;

    } catch (error) {
        throw new Error(`Dynamic prediction failed: ${error.message}`);
    }
}

function explainRejection(inputValues) {
    const contributions = modelData.weights.map((weight, i) => weight * inputValues[i]);
    const indexed = contributions.map((contrib, i) => ({
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

    suggestions.push({
        category: "Income",
        action: "Increase your annual income",
        details: "Consider additional income sources, part-time work, or skill development",
        priority: "High",
        timeline: "3-6 months"
    });

    return suggestions.slice(0, 5);
}

function getReasonForFeature(featureName, value) {
    if (featureName.includes('applicant_income_000s')) {
        return 'Income level may be insufficient for the requested loan amount';
    } else if (featureName.includes('loan_amount_000s')) {
        return 'Requested loan amount is high relative to qualifications';
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
    }
    return null;
}
