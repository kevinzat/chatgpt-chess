import React from 'react'
import { Settings, Crown } from 'lucide-react'

const Header = ({ onSettingsClick }) => {
  return (
    <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Crown className="w-8 h-8 text-chess-accent" />
            <h1 className="text-2xl font-bold text-white">
              Chess vs ChatGPT
            </h1>
          </div>
          
          <button
            onClick={onSettingsClick}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors duration-200"
            title="Settings"
          >
            <Settings className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header 