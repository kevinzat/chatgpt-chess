import React, { useState } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'

const Settings = ({ apiKey, model, onApiKeyChange, onModelChange, onClose }) => {
  const [showApiKey, setShowApiKey] = useState(false)
  const [tempApiKey, setTempApiKey] = useState(apiKey)
  const [tempModel, setTempModel] = useState(model)

  const handleSave = () => {
    onApiKeyChange(tempApiKey)
    onModelChange(tempModel)
    onClose()
  }

  const models = [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'gpt-3.5-turbo-16k', label: 'GPT-3.5 Turbo 16K' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4-turbo-preview', label: 'GPT-4 Turbo Preview' },
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' }
  ]

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              OpenAI API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-chess-accent"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-white/10 rounded"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Your API key is stored locally and never sent to our servers.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              OpenAI Model
            </label>
            <select
              value={tempModel}
              onChange={(e) => setTempModel(e.target.value)}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-chess-accent"
            >
              {models.map((modelOption) => (
                <option key={modelOption.value} value={modelOption.value}>
                  {modelOption.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Choose the AI model that will play against you.
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-primary flex-1"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings 