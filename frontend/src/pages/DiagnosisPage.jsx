import { useState } from 'react'
import { chatApi, diagnosisApi } from '../api/client'
import { ErrorAlert, SuccessAlert, Loading, Card, DisclaimerBanner, ConfidenceMeter, Button } from '../components/UiComponents'

export function DiagnosisPage() {
  const [activeTab, setActiveTab] = useState('text') // 'text', 'image', 'multimodal'
  const [chatSessionId, setChatSessionId] = useState(null)
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [messages, setMessages] = useState([])
  const [userInput, setUserInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [result, setResult] = useState(null)
  const [collectedData, setCollectedData] = useState(null)

  const startChat = async () => {
    setLoading(true)
    try {
      const res = await chatApi.startChat()
      setChatSessionId(res.data.session_id)
      setCurrentQuestion(res.data.question)
      setMessages([{ role: 'bot', text: res.data.message }])
      setError('')
    } catch (err) {
      setError('Failed to start chat')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!userInput.trim()) return

    setMessages((prev) => [...prev, { role: 'user', text: userInput }])
    setLoading(true)

    try {
      const res = await chatApi.sendMessage(chatSessionId, userInput)
      const response = res.data

      if (response.status === 'red_flag') {
        setMessages((prev) => [...prev, { role: 'alert', text: response.message }])
        setError('🚨 ' + response.message)
      } else if (response.status === 'complete') {
        setMessages((prev) => [...prev, { role: 'bot', text: response.message }])
        setCollectedData(response.collected_data)
        setSuccess('All symptoms collected! Ready for diagnosis.')
      } else {
        setMessages((prev) => [...prev, { role: 'bot', text: response.message }])
        if (response.question) {
          setCurrentQuestion(response.question)
        }
      }

      setUserInput('')
    } catch (err) {
      setError('Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const submitTextDiagnosis = async () => {
    if (!collectedData) return

    setLoading(true)
    try {
      const res = await diagnosisApi.textDiagnosis(
        collectedData.age,
        collectedData.gender,
        collectedData.symptom_text,
        collectedData.duration_days,
        collectedData.severity,
        collectedData.temperature || 98.6,
        collectedData.pain_level || 0
      )

      setResult(res.data)
      setSuccess('Diagnosis completed!')
    } catch (err) {
      setError('Diagnosis failed: ' + (err.response?.data?.error || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  // Chatbot Tab
  if (activeTab === 'text') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <DisclaimerBanner />

        <Card>
          <h1 className="text-3xl font-bold mb-6">Symptom Diagnosis</h1>

          {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}
          {success && <SuccessAlert message={success} onDismiss={() => setSuccess('')} />}

          {result ? (
            <div className="space-y-6">
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                <h3 className="text-lg font-bold text-green-800 mb-2">Diagnosis Result</h3>
                <p className="text-2xl font-bold text-green-700 mb-4">{result.prediction.predicted_disease}</p>
                <ConfidenceMeter score={result.prediction.confidence} />
                <p className="mt-4 text-gray-700">{result.advice}</p>
              </div>

              <Button onClick={() => window.location.href = `/reports?id=${result.diagnosis_id}`}>
                View Full Report
              </Button>
              <Button variant="secondary" onClick={() => window.location.reload()}>
                New Diagnosis
              </Button>
            </div>
          ) : !chatSessionId ? (
            <div className="text-center space-y-4">
              <p className="text-gray-600">Click below to start the symptom questionnaire:</p>
              <Button onClick={startChat} disabled={loading}>
                {loading ? 'Starting...' : 'Start Symptom Check'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white border rounded-lg p-4 h-96 overflow-y-auto space-y-3">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-500 text-white' : msg.role === 'alert' ? 'bg-red-100 text-red-800' : 'bg-gray-200 text-gray-800'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loading && <Loading message="Analyzing..." />}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your answer..."
                  disabled={loading || !currentQuestion}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={sendMessage} disabled={loading || !currentQuestion}>
                  Send
                </Button>
              </div>

              {collectedData && (
                <Button onClick={submitTextDiagnosis} disabled={loading} className="w-full">
                  {loading ? 'Processing...' : 'Get Diagnosis'}
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    )
  }

  return <div className="container mx-auto px-4 py-8"><p>Other tabs coming soon...</p></div>
}
