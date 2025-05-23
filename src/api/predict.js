'use client'
import { spawn } from 'child_process';
import path from 'path';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { features } = req.body;

    try {
        const result = await runPythonPrediction(features);
        res.status(200).json(result);
    } catch (error) {
        console.error('Prediction error:', error);
        res.status(500).json({ error: 'Prediction failed' });
    }
}

function runPythonPrediction(features) {
    return new Promise((resolve, reject) => {
        const scriptPath = path.join(process.cwd(), 'python', 'predict.py');
        const python = spawn('python', [scriptPath, JSON.stringify(features)]);

        let result = '';
        let error = '';

        python.stdout.on('data', (data) => {
            result += data.toString();
        });

        python.stderr.on('data', (data) => {
            error += data.toString();
        });

        python.on('close', (code) => {
            if (code === 0) {
                try {
                    resolve(JSON.parse(result));
                } catch (parseError) {
                    reject(new Error('Failed to parse Python output'));
                }
            } else {
                reject(new Error(`Python script failed: ${error}`));
            }
        });
    });
}
