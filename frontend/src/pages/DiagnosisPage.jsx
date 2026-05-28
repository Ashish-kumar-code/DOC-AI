import { useState } from 'react';
import { diagnosisApi, reportApi } from '../api/client';
import {
  ErrorAlert,
  SuccessAlert,
  Loading,
  ConfidenceMeter,
  TabButton,
  FilePreview,
  DisclaimerBanner,
  Label,
  Card,
} from '../components/UiComponents';
import {
  FileText,
  Image as ImageIcon,
  Zap,
  Download,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

export default function DiagnosisPage() {
  const [activeTab, setActiveTab] = useState('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Text Form State
  const [textForm, setTextForm] = useState({
    age: 30,
    gender: 'male',
    symptom_text: '',
    duration_days: 5,
    severity: 'moderate',
    temperature: 98.6,
    pain_level: 5,
  });

  // Image State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // ===== TEXT DIAGNOSIS =====
  const handleTextDiagnosis = async () => {
    if (!textForm.symptom_text.trim()) {
      setError('Please describe your symptoms');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');

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
      setSuccessMessage('Diagnosis complete! Review your results below.');
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Failed to process diagnosis. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ===== IMAGE UPLOAD & DIAGNOSIS =====
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be under 5MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
  };

  const handleImageDiagnosis = async () => {
    if (!imageFile) {
      setError('Please select an image');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('image_type', 'xray');

    try {
      const res = await diagnosisApi.imageDiagnosis(formData);
      setResult(res.data);
      setSuccessMessage('Image analysis complete! Review your results below.');
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Failed to analyze image. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ===== MULTIMODAL DIAGNOSIS =====
  const handleMultimodal = async () => {
    if (!imageFile || !textForm.symptom_text.trim()) {
      setError('Both symptoms and image are required');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMessage('');

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('image_type', 'xray');
    Object.keys(textForm).forEach((key) => formData.append(key, textForm[key]));

    try {
      const res = await diagnosisApi.multimodalDiagnosis(formData);
      setResult(res.data);
      setSuccessMessage(
        'Multimodal analysis complete! Review your combined results below.'
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          'Failed to process multimodal diagnosis. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ===== RESET & DOWNLOAD =====
  const handleReset = () => {
    setResult(null);
    setError('');
    setSuccessMessage('');
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setTextForm({ ...textForm, symptom_text: '' });
  };

  const handleDownloadPDF = async () => {
    if (!result?.report_id && !result?.report_url) {
      setError('PDF download not available');
      return;
    }

    const diagnosisId = result.diagnosis_id || result.report_id || null;
    if (!diagnosisId) {
      setError('Unable to determine report ID.');
      return;
    }

    try {
      const response = await reportApi.downloadPdf(diagnosisId);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `DOC_AI_Report_${diagnosisId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download PDF. Please try again.');
      console.error(err);
    }
  };

  // ===== RENDER =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12">
      <div className="content-max-width section-spacing">
        {/* HEADER */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-3xl mb-4">
            <Zap className="text-green-600" size={32} />
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-3">AI Diagnosis</h1>
          <p className="text-xl text-gray-600">
            Get intelligent health insights powered by medical AI
          </p>
        </div>

        {/* DISCLAIMER */}
        <div className="mb-8">
          <DisclaimerBanner />
        </div>

        {/* ALERTS */}
        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} onDismiss={() => setError('')} />
          </div>
        )}
        {successMessage && (
          <div className="mb-6">
            <SuccessAlert
              message={successMessage}
              onDismiss={() => setSuccessMessage('')}
            />
          </div>
        )}

        {/* TABS */}
        {!result && (
          <>
            <div className="flex flex-wrap gap-4 justify-center mb-12">
              <TabButton
                icon={FileText}
                active={activeTab === 'text'}
                onClick={() => setActiveTab('text')}
              >
                Text Symptoms
              </TabButton>
              <TabButton
                icon={ImageIcon}
                active={activeTab === 'image'}
                onClick={() => setActiveTab('image')}
              >
                Image Analysis
              </TabButton>
              <TabButton
                icon={Zap}
                active={activeTab === 'multimodal'}
                onClick={() => setActiveTab('multimodal')}
              >
                Multimodal
              </TabButton>
            </div>

            {/* ===== TEXT SYMPTOMS TAB ===== */}
            {activeTab === 'text' && (
              <Card variant="highlight" className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  Describe Your Symptoms
                </h2>

                <div className="space-y-6">
                  {/* Symptom Text */}
                  <div>
                    <Label required htmlFor="symptom-text">
                      What symptoms are you experiencing?
                    </Label>
                    <textarea
                      id="symptom-text"
                      value={textForm.symptom_text}
                      onChange={(e) =>
                        setTextForm({
                          ...textForm,
                          symptom_text: e.target.value,
                        })
                      }
                      className="input input-lg"
                      rows="5"
                      placeholder="Describe your symptoms in detail... e.g., I have a persistent cough with fever, body aches..."
                    />
                    <p className="text-sm text-gray-600 mt-2">
                      Provide as much detail as possible for better accuracy
                    </p>
                  </div>

                  {/* Two Column Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="age">Age</Label>
                      <input
                        id="age"
                        type="number"
                        value={textForm.age}
                        onChange={(e) =>
                          setTextForm({
                            ...textForm,
                            age: parseInt(e.target.value),
                          })
                        }
                        className="input"
                        min="1"
                        max="120"
                      />
                    </div>
                    <div>
                      <Label htmlFor="gender">Gender</Label>
                      <select
                        id="gender"
                        value={textForm.gender}
                        onChange={(e) =>
                          setTextForm({ ...textForm, gender: e.target.value })
                        }
                        className="input"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Duration & Severity */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="duration">Duration (days)</Label>
                      <input
                        id="duration"
                        type="number"
                        value={textForm.duration_days}
                        onChange={(e) =>
                          setTextForm({
                            ...textForm,
                            duration_days: parseInt(e.target.value),
                          })
                        }
                        className="input"
                        min="1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="severity">Severity</Label>
                      <select
                        id="severity"
                        value={textForm.severity}
                        onChange={(e) =>
                          setTextForm({
                            ...textForm,
                            severity: e.target.value,
                          })
                        }
                        className="input"
                      >
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                    </div>
                  </div>

                  {/* Temperature & Pain Level */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="temp">Temperature (°F)</Label>
                      <input
                        id="temp"
                        type="number"
                        value={textForm.temperature}
                        onChange={(e) =>
                          setTextForm({
                            ...textForm,
                            temperature: parseFloat(e.target.value),
                          })
                        }
                        className="input"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pain">Pain Level (0-10)</Label>
                      <div className="flex items-center gap-4">
                        <input
                          id="pain"
                          type="range"
                          min="0"
                          max="10"
                          value={textForm.pain_level}
                          onChange={(e) =>
                            setTextForm({
                              ...textForm,
                              pain_level: parseInt(e.target.value),
                            })
                          }
                          className="flex-1"
                        />
                        <span className="text-lg font-bold text-green-600 w-8">
                          {textForm.pain_level}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleTextDiagnosis}
                    disabled={loading || !textForm.symptom_text.trim()}
                    className="btn-primary-lg w-full mt-8"
                  >
                    {loading ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⟳</span>
                        Analyzing Symptoms...
                      </>
                    ) : (
                      'Get AI Diagnosis'
                    )}
                  </button>
                </div>
              </Card>
            )}

            {/* ===== IMAGE ANALYSIS TAB ===== */}
            {activeTab === 'image' && (
              <Card variant="highlight" className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  Medical Image Analysis
                </h2>

                <div className="space-y-6">
                  <div>
                    <Label>Upload Medical Image</Label>
                    <p className="text-sm text-gray-600 mb-4">
                      Upload an X-ray, CT scan, or other medical image (JPG,
                      PNG, up to 5MB)
                    </p>

                    <div className="border-2 border-dashed border-green-300 rounded-3xl p-12 text-center bg-green-50 transition-colors hover:border-green-600 hover:bg-green-100">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer block"
                      >
                        <ImageIcon
                          size={48}
                          className="text-green-600 mx-auto mb-3"
                        />
                        <p className="text-lg font-semibold text-gray-900">
                          Click to upload or drag & drop
                        </p>
                        <p className="text-sm text-gray-600">
                          PNG, JPG up to 5MB
                        </p>
                      </label>
                    </div>
                  </div>

                  {imagePreview && (
                    <div>
                      <Label>Preview</Label>
                      <FilePreview
                        file={imageFile}
                        preview={imagePreview}
                        onRemove={handleRemoveImage}
                        fileType="image"
                      />
                    </div>
                  )}

                  <button
                    onClick={handleImageDiagnosis}
                    disabled={loading || !imageFile}
                    className="btn-primary-lg w-full"
                  >
                    {loading ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⟳</span>
                        Analyzing Image...
                      </>
                    ) : (
                      'Analyze Medical Image'
                    )}
                  </button>
                </div>
              </Card>
            )}

            {/* ===== MULTIMODAL TAB ===== */}
            {activeTab === 'multimodal' && (
              <Card variant="highlight" className="max-w-3xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-8">
                  Combined Analysis
                </h2>
                <p className="text-gray-600 mb-8">
                  Get the most accurate diagnosis by combining symptom
                  description with medical images
                </p>

                <div className="space-y-8">
                  {/* Symptoms Section */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Step 1: Describe Symptoms
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label required htmlFor="multi-symptom-text">
                          Symptoms
                        </Label>
                        <textarea
                          id="multi-symptom-text"
                          value={textForm.symptom_text}
                          onChange={(e) =>
                            setTextForm({
                              ...textForm,
                              symptom_text: e.target.value,
                            })
                          }
                          className="input input-lg"
                          rows="4"
                          placeholder="Describe your symptoms..."
                        />
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label htmlFor="multi-age">Age</Label>
                          <input
                            id="multi-age"
                            type="number"
                            value={textForm.age}
                            onChange={(e) =>
                              setTextForm({
                                ...textForm,
                                age: parseInt(e.target.value),
                              })
                            }
                            className="input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="multi-gender">Gender</Label>
                          <select
                            id="multi-gender"
                            value={textForm.gender}
                            onChange={(e) =>
                              setTextForm({
                                ...textForm,
                                gender: e.target.value,
                              })
                            }
                            className="input"
                          >
                            <option value="male">M</option>
                            <option value="female">F</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <div>
                          <Label htmlFor="multi-duration">Duration</Label>
                          <input
                            id="multi-duration"
                            type="number"
                            value={textForm.duration_days}
                            onChange={(e) =>
                              setTextForm({
                                ...textForm,
                                duration_days: parseInt(e.target.value),
                              })
                            }
                            className="input"
                          />
                        </div>
                        <div>
                          <Label htmlFor="multi-severity">Severity</Label>
                          <select
                            id="multi-severity"
                            value={textForm.severity}
                            onChange={(e) =>
                              setTextForm({
                                ...textForm,
                                severity: e.target.value,
                              })
                            }
                            className="input"
                          >
                            <option value="mild">Mild</option>
                            <option value="moderate">Mod</option>
                            <option value="severe">Severe</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Image Section */}
                  <div className="border-t pt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                      Step 2: Upload Medical Image
                    </h3>

                    <div className="border-2 border-dashed border-green-300 rounded-3xl p-10 text-center bg-green-50">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="multi-upload"
                      />
                      <label
                        htmlFor="multi-upload"
                        className="cursor-pointer block"
                      >
                        <ImageIcon
                          size={40}
                          className="text-green-600 mx-auto mb-2"
                        />
                        <p className="font-semibold text-gray-900">
                          Click to upload image
                        </p>
                      </label>
                    </div>

                    {imagePreview && (
                      <div className="mt-6">
                        <FilePreview
                          file={imageFile}
                          preview={imagePreview}
                          onRemove={handleRemoveImage}
                          fileType="image"
                        />
                      </div>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleMultimodal}
                    disabled={
                      loading ||
                      !textForm.symptom_text.trim() ||
                      !imageFile
                    }
                    className="btn-primary-lg w-full"
                  >
                    {loading ? (
                      <>
                        <span className="inline-block animate-spin mr-2">⟳</span>
                        Analyzing...
                      </>
                    ) : (
                      'Run Combined Analysis'
                    )}
                  </button>
                </div>
              </Card>
            )}
          </>
        )}

        {/* ===== RESULT DISPLAY ===== */}
        {result && (
          <div className="max-w-3xl mx-auto">
            {/* Success Message */}
            <div className="mb-8">
              <SuccessAlert
                title="Diagnosis Complete"
                message="Please review your results carefully and consult a healthcare provider."
              />
            </div>

            {/* Main Result Card */}
            <Card variant="highlight" className="mb-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-3xl mb-4">
                  <Zap className="text-green-600" size={32} />
                </div>
                <h2 className="text-4xl font-bold text-gray-900 mb-2">
                  {result.final_diagnosis?.disease ||
                    result.prediction?.predicted_disease ||
                    'Assessment Complete'}
                </h2>
                <p className="text-lg text-gray-600">AI Diagnosis Assessment</p>
              </div>

              {/* Confidence Meter */}
              <div className="bg-white rounded-2xl p-6 mb-8">
                <ConfidenceMeter
                  score={
                    (result.final_diagnosis?.confidence ||
                      result.prediction?.confidence ||
                      0) / 100
                  }
                  label="Confidence Score"
                />
              </div>

              {/* Advice */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
                <div className="flex gap-3">
                  <AlertCircle className="text-blue-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">
                      Recommended Action
                    </h3>
                    <p className="text-blue-800">{result.advice}</p>
                  </div>
                </div>
              </div>

              {/* Predictions Details */}
              {result.text_prediction && (
                <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Text Analysis Result
                  </h4>
                  <p className="text-sm text-gray-700">
                    {result.text_prediction.predicted_disease}
                  </p>
                </div>
              )}

              {result.image_prediction && (
                <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    Image Analysis Result
                  </h4>
                  <p className="text-sm text-gray-700">
                    {result.image_prediction.predicted_disease}
                  </p>
                </div>
              )}

              {/* Disclaimer in result */}
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8">
                <p className="text-sm text-amber-800">
                  <strong>Disclaimer:</strong> This is an AI-assisted preliminary
                  assessment for educational purposes only. It is not a
                  substitute for professional medical advice. Always consult
                  with a licensed healthcare provider.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                {result.report_url && (
                  <button
                    onClick={handleDownloadPDF}
                    className="btn-primary-lg flex-1 flex items-center justify-center gap-2"
                  >
                    <Download size={20} />
                    Download PDF Report
                  </button>
                )}
                <button
                  onClick={handleReset}
                  className="btn-secondary flex-1 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} />
                  New Diagnosis
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}