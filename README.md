# **AI Loan Approval Predictor**

A full-stack loan approval prediction application built with Python, PyTorch, ONNX, and Next.js. Uses a logistic regression model trained on HMDA data to predict loan approval chances and provides detailed, dynamic explanations using SHAP and LIME.

---

## **🚀 Features**

- **🤖 Machine Learning Model**: Logistic regression trained on real HMDA data
- **⚡ ONNX Model Export**: Model exported to ONNX for fast, cross-platform inference
- **🔍 Dynamic Explanations**: Uses SHAP and LIME to provide real-time, per-prediction explanations
- **💻 Next.js Frontend**: Modern, responsive React-based UI with Tailwind CSS
- **🔗 API Integration**: Next.js API routes for model inference and explanation generation
- **✅ Form Validation**: Comprehensive client-side validation with user-friendly error messages
- **💡 Improvement Suggestions**: Actionable recommendations to improve loan approval chances
- **📊 Visual Analytics**: Interactive charts and progress indicators
- **🎨 Modern UI/UX**: Glassmorphism design with dark theme and animations

---

## **📁 Project Structure**

```
loan-predictor/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── predict/
│   │   │       └── route.js          # API route for prediction and explanations
│   │   ├── layout.js                 # Root layout component
│   │   ├── page.js                   # Main page component
│   │   └── globals.css               # Global styles and animations
│   └── components/
│       └── LoanPredictor.js          # Main loan prediction form component
├── public/
│   ├── logistic_regression_model.onnx  # ONNX model file
│   └── model_data.json                 # Model metadata and scaler info
├── model_training.py                 # Python script for training and exporting model
├── package.json                      # Node.js dependencies
├── next.config.mjs                   # Next.js configuration
├── tailwind.config.js                # Tailwind CSS configuration
└── README.md                         # This file
```

---

## **🛠️ Setup Instructions**

### **Prerequisites**

- Node.js (v18+ recommended)
- Python 3.8+
- npm or yarn
- Git

### **Backend (Model Training)**

1. **Install Python dependencies:**
```bash
pip install torch numpy pandas scikit-learn shap lime onnx
```

2. **Prepare your HMDA dataset:**
   - Download HMDA 2016 data for Washington (WA) and Alaska (AK)
   - Place CSV files in the same directory as `model_training.py`

3. **Run the training script:**
```bash
python model_training.py
```

This will generate:
- `logistic_regression_model.onnx` (ONNX model file)
- `model_data.json` (Model metadata and preprocessing info)

### **Frontend (Next.js App)**

1. **Clone the repository:**
```bash
git clone <your-repo-url>
cd loan-predictor
```

2. **Install Node.js dependencies:**
```bash
npm install
```

3. **Move model files to public directory:**
```bash
mv logistic_regression_model.onnx public/
mv model_data.json public/
```

4. **Run the development server:**
```bash
npm run dev
```

5. **Open your browser:**
```
http://localhost:3000
```

---

## **📋 Usage**

### **Making a Prediction**

1. **Fill out the loan application form** with all required fields:
   - Loan details (type, purpose, amount)
   - Applicant information (income, demographics)
   - Property details (type, occupancy)
   - Financial information (pre-approval, lien status)

2. **Submit the form** to get an instant prediction

3. **Review the results:**
   - Approval/Rejection decision
   - Confidence percentage
   - Detailed explanations

### **Understanding Explanations**

- **📊 Traditional Explanations**: Shows feature contributions using model weights
- **🔍 SHAP Analysis**: Displays feature importance with interaction effects
- **🎯 LIME Interpretability**: Shows local prediction sensitivity
- **💡 Improvement Suggestions**: Actionable recommendations with timelines

---

## **🔬 Explanation Methods**

### **Traditional Method**
- Uses model weights × input values to show feature contributions
- Fast and interpretable for logistic regression
- Ranks features by positive/negative impact

### **SHAP (SHapley Additive exPlanations)**
- Computes marginal contributions using coalition game theory
- Provides feature importance with interaction effects
- Shows how each feature pushes prediction toward approval/rejection

### **LIME (Local Interpretable Model-agnostic Explanations)**
- Creates local explanations around specific predictions
- Shows prediction sensitivity to feature changes
- Helps understand model behavior in local regions

---

## **🏗️ Technical Architecture**

### **Backend**
- **Model**: PyTorch Logistic Regression
- **Export**: ONNX format for cross-platform compatibility
- **Preprocessing**: StandardScaler for numerical features, One-hot encoding for categories
- **Explainability**: Dynamic SHAP and LIME computation

### **Frontend**
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom animations
- **State Management**: React hooks (useState, useEffect)
- **Validation**: Real-time form validation with error handling
- **API**: RESTful API routes for prediction

### **Deployment**
- **Model Serving**: Next.js API routes with ONNX runtime
- **Static Assets**: Model files served from public directory
- **Performance**: Optimized with caching and lazy loading

---

## **⚡ Performance Optimizations**

- **Model Caching**: ONNX model loaded once and cached in memory
- **Background Data**: Small subset for faster SHAP computation
- **Lazy Loading**: Components loaded on demand
- **Form Validation**: Client-side validation to reduce API calls
- **Error Handling**: Graceful degradation for failed explanations

---

## **🐛 Troubleshooting**

### **Common Issues**

1. **"Model initialization failed"**
   - Ensure `logistic_regression_model.onnx` is in `public/` directory
   - Check file permissions and size

2. **"prediction is not defined" error**
   - Clear browser cache and restart development server
   - Check React component state initialization

3. **Missing explanations**
   - Verify API response contains explanation data
   - Check browser console for JavaScript errors

4. **Form validation errors**
   - Ensure all required fields are filled
   - Check numerical field ranges and formats

### **Development Issues**

1. **SHAP/LIME errors**
   - Install latest versions of SHAP and LIME
   - Check input data types and shapes

2. **Next.js build errors**
   - Clear `.next` directory: `rm -rf .next`
   - Reinstall dependencies: `rm -rf node_modules && npm install`

3. **ONNX runtime issues**
   - Use `onnxruntime-web` instead of `onnxruntime-node`
   - Check Next.js configuration for external packages

---

## **🚀 Deployment**

### **Vercel (Recommended)**
```bash
npm install -g vercel
vercel --prod
```

### **Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### **Manual Deployment**
```bash
npm run build
npm start
```

---

## **📊 Model Performance**

- **Training Accuracy**: ~92%
- **Test Accuracy**: ~91%
- **Features**: 200+ after one-hot encoding
- **Training Data**: HMDA 2016 Washington state
- **Test Data**: HMDA 2016 Alaska state

---

## **🔮 Future Enhancements**

- [ ] **Real-time Model Updates**: Retrain model with new data
- [ ] **Advanced Visualizations**: Feature importance charts
- [ ] **A/B Testing**: Compare different explanation methods
- [ ] **Mobile App**: React Native version
- [ ] **Multi-language Support**: Internationalization
- [ ] **Database Integration**: User session management
- [ ] **Enhanced Security**: Rate limiting and authentication

---

## **📄 License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## **🙏 Acknowledgments**

- **HMDA Dataset**: Federal Financial Institutions Examination Council
- **PyTorch**: Meta AI for deep learning framework
- **ONNX**: Microsoft and partners for model interoperability
- **SHAP**: Scott Lundberg for explainable AI
- **LIME**: Marco Tulio Ribeiro for local interpretability
- **Next.js**: Vercel for React framework
- **Tailwind CSS**: Tailwind Labs for styling

---

## **👥 Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## **📞 Support**

For support, please open an issue in the GitHub repository or contact the maintainers.

---

**Built with ❤️ using AI and Machine Learning**