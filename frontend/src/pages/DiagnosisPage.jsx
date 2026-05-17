import { useState } from 'react';
import { diagnosisApi } from '../api/client';

export function DiagnosisPage() {
  const [activeTab, setActiveTab] = useState('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const [textForm, setTextForm] = useState({
    age: 30,
    gender: 'male',
    symptom_text: 'I have high fever, dry cough, body ache and fatigue for 5 days',
    duration_days: 5,
    severity: 'moderate',
    temperature: 38.5,
    pain_level: 7
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleTextDiagnosis = async () => {
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
      setError(err.response?.data?.error || 'Failed to get diagnosis');
      console.error(err);
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

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold text-green-700 mb-8 text-center">🩺 DOC AI Diagnosis</h1>

      <div className="flex gap-4 mb-8 bg-white p-2 rounded-3xl shadow">
        {['text', 'image'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-4 rounded-2xl font-medium ${activeTab === tab ? 'bg-green-600 text-white' : 'bg-gray-100'}`}
          >
            {tab === 'text' ? '📝 Text Symptoms' : '🖼️ Image Only'}
          </button>
        ))}
      </div>

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-2xl mb-6">{error}</div>}

      {activeTab === 'text' && (
        <div className="bg-white rounded-3xl shadow p-8">
          <textarea
            value={textForm.symptom_text}
            onChange={(e) => setTextForm({ ...textForm, symptom_text: e.target.value })}
            className="w-full h-40 p-5 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-green-500"
            placeholder="Describe your symptoms..."
          />
          <button
            onClick={handleTextDiagnosis}
            disabled={loading}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-semibold"
          >
            {loading ? 'Analyzing...' : 'Get Diagnosis'}
          </button>
        </div>
      )}

      {activeTab === 'image' && (
        <div className="bg-white rounded-3xl shadow p-8 text-center">
          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="img" />
          <label htmlFor="img" className="cursor-pointer block border-2 border-dashed border-gray-300 rounded-3xl py-16">
            Click to upload X-ray or medical image
          </label>
          {imagePreview && <img src={imagePreview} className="mt-6 mx-auto max-h-80 rounded-2xl" />}
          <button
            onClick={handleImageDiagnosis}
            disabled={loading || !imageFile}
            className="mt-6 w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-semibold"
          >
            Analyze Image
          </button>
        </div>
      )}

      {result && (
        <div className="mt-10 bg-white rounded-3xl shadow p-8">
          <h2 className="text-3xl font-bold text-green-700">
            {result.final_diagnosis?.disease || result.prediction?.predicted_disease}
          </h2>
          <p className="text-2xl mt-4">
            Confidence: <strong>{result.final_diagnosis?.confidence || result.prediction?.confidence}%</strong>
          </p>
          <p className="mt-6 text-lg">{result.advice}</p>
        </div>
      )}
    </div>
  );
}