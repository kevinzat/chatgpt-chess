import React, { useState } from 'react'
import ChessGame from './components/ChessGame'
import Header from './components/Header'
import Settings from './components/Settings'

function App() {
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('gpt-4.1-nano')
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-chess-dark to-gray-900">
      <Header onSettingsClick={() => setShowSettings(true)} />
      
      <main className="container mx-auto px-4 py-8">
        {!apiKey ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="card max-w-md w-full text-center">
              <h2 className="text-2xl font-bold mb-4">Welcome to Chess vs ChatGPT</h2>
              <p className="mb-6 text-gray-300">
                To start playing, you'll need to enter your OpenAI API key and select a model.
              </p>
              <button 
                onClick={() => setShowSettings(true)}
                className="btn-primary"
              >
                Enter API Key & Select Model
              </button>
            </div>
          </div>
        ) : (
          <ChessGame apiKey={apiKey} model={model} />
        )}
      </main>

      {showSettings && (
        <Settings 
          apiKey={apiKey}
          model={model}
          onApiKeyChange={setApiKey}
          onModelChange={setModel}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  )
}

export default App 
