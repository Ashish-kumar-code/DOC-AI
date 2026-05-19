import { useState } from 'react';
import { diagnosisApi } from '../api/client';

export default function DiagnosisPage() {
  const [activeTab, setActiveTab] = useState('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Text Form
  const [textForm, setTextForm] = useState({
    age: 30,
    gender: 'male',
    symptom_text: '',
    duration_days: 5,
    severity: 'moderate',
    temperature: 38.5,
    pain_level: 6
  });

  // Image
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleTextDiagnosis = async () => {
    if (!textForm.symptom_text.trim()) {
      setError("Please describe your symptoms");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await diagnosisApi.textDiagnosis(
        textForm.age,
        textForm.gender,
        textForm.symptom_text,
        textForm.duration_days,
        textForm.severity,
        textForm.temperature,
        textForm.pain_level
      );
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Diagnosis failed');
    }
    setLoading(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageDiagnosis = async () => {
    if (!imageFile) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('image_type', 'xray');

    try {
      const res = await diagnosisApi.imageDiagnosis(formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Image diagnosis failed');
    }
    setLoading(false);
  };

  const handleMultimodal = async () => {
    if (!imageFile || !textForm.symptom_text.trim()) {
      setError("Both symptoms and image are required");
      return;
    }
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('image_type', 'xray');
    Object.keys(textForm).forEach(key => formData.append(key, textForm[key]));

    try {
      const res = await diagnosisApi.multimodalDiagnosis(formData);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Multimodal diagnosis failed');
    }
    setLoading(false);
  };

  const reset = () => {
    setResult(null);
    setError('');
    setImageFile(null);
    setImagePreview(null);
    setTextForm({ ...textForm, symptom_text: '' });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-green-700 mb-3">🩺 New Diagnosis</h1>
        <p className="text-gray-600 text-lg">AI-Powered Multimodal Healthcare Analysis</p>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-3 mb-12 bg-white p-2 rounded-3xl shadow">
        {['text', 'image', 'multimodal'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-10 py-4 rounded-2xl font-medium transition-all ${
              activeTab === tab ? 'bg-green-600 text-white shadow' : 'hover:bg-gray-100'
            }`}
          >
            {tab === 'text' && '📝 Text Symptoms'}
            {tab === 'image' && '🖼️ Image Analysis'}
            {tab === 'multimodal' && '🔗 Text + Image'}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-2xl mb-8">{error}</div>}

      {/* Text Tab */}
      {activeTab === 'text' && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Describe Your Symptoms</h2>
          <textarea
            value={textForm.symptom_text}
            onChange={(e) => setTextForm({ ...textForm, symptom_text: e.target.value })}
            className="input h-40 resize-y"
            placeholder="I have high fever, dry cough, severe body ache..."
          />
          <button
            onClick={handleTextDiagnosis}
            disabled={loading || !textForm.symptom_text.trim()}
            className="btn-primary w-full mt-6 text-lg py-4"
          >
            {loading ? 'Analyzing...' : 'Get AI Diagnosis'}
          </button>
        </div>
      )}

      {/* Image Tab */}
      {activeTab === 'image' && (
        <div className="card text-center">
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="image-upload" />
          <label htmlFor="image-upload" className="cursor-pointer block py-20 border-2 border-dashed border-gray-300 rounded-3xl">
            📸 Click or drag medical image (X-ray, skin lesion, etc.)
          </label>
          {imagePreview && <img src={imagePreview} className="mt-8 mx-auto max-h-96 rounded-2xl shadow" alt="preview" />}
          <button
            onClick={handleImageDiagnosis}
            disabled={loading || !imageFile}
            className="btn-primary w-full mt-8 text-lg py-4"
          >
            {loading ? 'Analyzing Image...' : 'Analyze Image'}
          </button>
        </div>
      )}

      {/* Multimodal Tab */}
      {activeTab === 'multimodal' && (
        <div className="card">
          <h2 className="text-2xl font-bold mb-6">Text + Image Analysis</h2>
          <textarea
            value={textForm.symptom_text}
            onChange={(e) => setTextForm({ ...textForm, symptom_text: e.target.value })}
            className="input h-32 mb-6"
            placeholder="Describe your symptoms..."
          />
          <div className="border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center mb-8">
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="multi-upload" />
            <label htmlFor="multi-upload" className="cursor-pointer">
              📸 Upload supporting medical image
            </label>
          </div>
          {imagePreview && <img src={imagePreview} className="mx-auto max-h-64 rounded-2xl mb-8" alt="preview" />}
          <button
            onClick={handleMultimodal}
            disabled={loading || !textForm.symptom_text.trim() || !imageFile}
            className="btn-primary w-full text-lg py-4"
          >
            {loading ? 'Analyzing...' : 'Run Multimodal Diagnosis'}
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-12 card">
          <h2 className="text-3xl font-bold text-green-700 mb-4">
            {result.final_diagnosis?.disease || result.prediction?.predicted_disease}
          </h2>
          <p className="text-2xl mb-6">
            Confidence: <strong className="text-green-600">{result.final_diagnosis?.confidence || result.prediction?.confidence}%</strong>
          </p>
          <p className="text-lg text-gray-700 mb-8">{result.advice}</p>

          {result.report_url && (
            <a 
              href={`http://localhost:5000${result.report_url}`}
              target="_blank"
              className="btn-primary inline-flex items-center gap-3 text-lg"
            >
              📥 Download Full PDF Report
            </a>
          )}
          <button onClick={reset} className="ml-4 text-gray-600 hover:underline">
            New Diagnosis
          </button>
        </div>
      )}
    </div>
  );
}