import React, { useState, useRef, useEffect } from 'react'
import { X, Send, Bot, User, Loader2, Eye, EyeOff, Play } from 'lucide-react'

const ChatPanel = ({ game, moveHistory, apiKey, model, showDetails, onShowDetailsChange, onClose }) => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const addTestMessage = () => {
    const testMessage = {
      id: Date.now(),
      text: "e4\n\nThis opens up the center and develops your king's pawn, which is a fundamental opening principle. The move e4 controls important central squares and prepares for rapid development of your pieces.",
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString(),
      details: {
        systemPrompt: `You are a chess expert and coach. You're analyzing a chess game and should provide helpful analysis, strategic advice, and suggest specific moves.

Current game state:
- FEN: ${game.fen()}
- Turn: ${game.turn() === 'w' ? 'White' : 'Black'}
- Status: ${game.isCheckmate() ? 'Checkmate' : game.isDraw() ? 'Draw' : game.isCheck() ? 'Check' : 'Normal'}
- Move history: ${moveHistory.map(move => move.san).join(', ')}

CRITICAL RESPONSE FORMAT:
When suggesting a move, ALWAYS start your response with the move in algebraic notation on its own line, like this:
"e4"

Then provide your explanation on the next line.

IMPORTANT INSTRUCTIONS:
1. When asked about the best move, suggest a specific move in algebraic notation (e.g., "e4", "Nf3", "O-O")
2. ALWAYS start your response with the move in algebraic notation on its own line
3. Always explain your reasoning for suggested moves
4. Analyze the current position and provide strategic insights
5. If the game is over, explain why and what led to the result
6. Be encouraging and educational in your responses

Provide helpful, educational responses about chess strategy, tactics, and the current position. Be encouraging and explain your reasoning. Keep responses concise but informative.`,
        userMessage: "What's the best move here?",
        gameState: {
          fen: game.fen(),
          turn: game.turn(),
          isCheck: game.isCheck(),
          isCheckmate: game.isCheckmate(),
          isDraw: game.isDraw(),
          moveHistory: moveHistory.map(move => move.san)
        },
        requestBody: {
          message: "What's the best move here?",
          gameState: {
            fen: game.fen(),
            turn: game.turn(),
            isCheck: game.isCheck(),
            isCheckmate: game.isCheckmate(),
            isDraw: game.isDraw(),
            moveHistory: moveHistory.map(move => move.san)
          },
          apiKey: "sk-..." // masked for security
        }
      }
    }
    setMessages([testMessage])
  }

  const sendMessage = async (message) => {
    if (!message.trim() || isLoading) return

    console.log('Sending message:', message)

    const userMessage = {
      id: Date.now(),
      text: message,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      const gameState = {
        fen: game.fen(),
        turn: game.turn(),
        isCheck: game.isCheck(),
        isCheckmate: game.isCheckmate(),
        isDraw: game.isDraw(),
        moveHistory: moveHistory.map(move => move.san)
      }

      const systemPrompt = `You are a chess expert and coach. You're analyzing a chess game and should provide helpful analysis, strategic advice, and suggest specific moves.

Current game state:
- FEN: ${gameState.fen}
- Turn: ${gameState.turn === 'w' ? 'White' : 'Black'}
- Status: ${gameState.isCheckmate ? 'Checkmate' : gameState.isDraw ? 'Draw' : gameState.isCheck ? 'Check' : 'Normal'}
- Move history: ${gameState.moveHistory.join(', ')}

CRITICAL RESPONSE FORMAT:
When suggesting a move, ALWAYS start your response with the move in algebraic notation on its own line, like this:
"e4"

Then provide your explanation on the next line.

IMPORTANT INSTRUCTIONS:
1. When asked about the best move, suggest a specific move in algebraic notation (e.g., "e4", "Nf3", "O-O")
2. ALWAYS start your response with the move in algebraic notation on its own line
3. Always explain your reasoning for suggested moves
4. Analyze the current position and provide strategic insights
5. If the game is over, explain why and what led to the result
6. Be encouraging and educational in your responses

Provide helpful, educational responses about chess strategy, tactics, and the current position. Be encouraging and explain your reasoning. Keep responses concise but informative.`

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const chatgptResponse = data.choices?.[0]?.message?.content || ''
      console.log('Response from OpenAI:', chatgptResponse)
      
      const requestBody = {
        systemPrompt,
        userMessage: message,
        model,
        gameState
      }
      
      const botMessage = {
        id: Date.now() + 1,
        text: chatgptResponse,
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        details: {
          systemPrompt,
          userMessage: message,
          gameState,
          requestBody
        }
      }

      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      console.error('Error sending message:', error)
      const errorMessage = {
        id: Date.now() + 1,
        text: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString(),
        isError: true
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(inputMessage)
  }

  const quickQuestions = [
    "What's the best move here?",
    "Analyze this position",
    "What's my opponent's plan?",
    "How can I improve my position?",
    "What are the tactical opportunities?"
  ]

  const renderMessageDetails = (message) => {
    if (!message.details) {
      console.log('No details for message:', message)
      return null
    }

    return (
      <div className="mt-3 p-3 bg-black/20 rounded-lg text-xs space-y-3 border border-gray-500">
        <div className="text-center">
          <span className="text-yellow-400 font-bold">🔍 DETAILED VIEW</span>
        </div>
        
        <div>
          <h4 className="font-semibold text-blue-400 mb-1">System Prompt:</h4>
          <pre className="whitespace-pre-wrap text-gray-300 bg-black/30 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto border border-gray-600">
            {message.details.systemPrompt}
          </pre>
        </div>
        
        <div>
          <h4 className="font-semibold text-blue-400 mb-1">User Message:</h4>
          <div className="bg-black/30 p-2 rounded border border-gray-600">
            {message.details.userMessage}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-blue-400 mb-1">Game State:</h4>
          <div className="bg-black/30 p-2 rounded space-y-1 border border-gray-600">
            <div><span className="text-gray-400">FEN:</span> <code className="text-blue-400 break-all">{message.details.gameState.fen}</code></div>
            <div><span className="text-gray-400">Turn:</span> {message.details.gameState.turn === 'w' ? 'White' : 'Black'}</div>
            <div><span className="text-gray-400">Status:</span> {message.details.gameState.isCheckmate ? 'Checkmate' : message.details.gameState.isDraw ? 'Draw' : message.details.gameState.isCheck ? 'Check' : 'Normal'}</div>
            <div><span className="text-gray-400">Move History:</span> {message.details.gameState.moveHistory.join(', ') || 'None'}</div>
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-blue-400 mb-1">Request Body:</h4>
          <pre className="whitespace-pre-wrap text-gray-300 bg-black/30 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto border border-gray-600">
            {JSON.stringify(message.details.requestBody, null, 2)}
          </pre>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-2xl h-[70vh] flex flex-col border border-gray-600">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600">
          <h2 className="text-xl font-bold text-white">Chat with ChatGPT</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={addTestMessage}
              className="p-2 rounded bg-purple-600 hover:bg-purple-700 text-white"
              title="Show Test Message"
            >
              <Play className="w-4 h-4" />
            </button>
            <button
              onClick={() => onShowDetailsChange(!showDetails)}
              className={`p-2 rounded text-white ${showDetails ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}
              title={showDetails ? "Hide Details" : "Show Details"}
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Game State Info */}
        <div className="p-4 bg-gray-700 border-b border-gray-600">
          <div className="grid grid-cols-2 gap-2 text-sm text-white">
            <div>
              <span className="text-gray-300">Turn:</span>
              <span className="ml-2 font-medium">
                {game.turn() === 'w' ? 'White' : 'Black'}
              </span>
            </div>
            <div>
              <span className="text-gray-300">Status:</span>
              <span className="ml-2 font-medium">
                {game.isCheckmate() ? 'Checkmate' : 
                 game.isDraw() ? 'Draw' : 
                 game.isCheck() ? 'Check' : 'Normal'}
              </span>
            </div>
            <div>
              <span className="text-gray-300">Legal Moves:</span>
              <span className="ml-2 font-medium">{game.moves().length}</span>
            </div>
            <div>
              <span className="text-gray-300">Moves Made:</span>
              <span className="ml-2 font-medium">{moveHistory.length}</span>
            </div>
          </div>
          
          {/* Current FEN */}
          <div className="mt-2 pt-2 border-t border-gray-600">
            <span className="text-gray-300 text-xs">Current FEN:</span>
            <div className="text-xs font-mono text-blue-400 bg-black p-2 rounded mt-1 break-all">
              {game.fen()}
            </div>
          </div>

          {/* Move History */}
          <div className="mt-2 pt-2 border-t border-gray-600">
            <span className="text-gray-300 text-xs">Move History:</span>
            <div className="text-xs font-mono text-green-400 bg-black p-2 rounded mt-1">
              {moveHistory.map(move => move.san).join(', ') || 'No moves yet'}
            </div>
          </div>
        </div>

        {/* Quick Questions */}
        <div className="p-4 bg-gray-700 border-b border-gray-600">
          <p className="text-sm text-gray-300 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => sendMessage(question)}
                disabled={isLoading}
                className="text-xs bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded-full transition-colors disabled:opacity-50 text-white"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Ask me anything about the current position!</p>
              <p className="text-xs mt-2">Click the purple play button to see a test message with details</p>
              <p className="text-xs mt-1">Or ask a question to see real ChatGPT prompts and responses</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id}>
                <div
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      message.sender === 'user' 
                        ? 'bg-blue-500' 
                        : 'bg-gray-600'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`rounded-lg px-3 py-2 ${
                      message.sender === 'user'
                        ? 'bg-blue-500 text-white'
                        : message.isError
                        ? 'bg-red-500/20 text-red-200'
                        : 'bg-gray-600 text-white'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                      <p className="text-xs opacity-60 mt-1">{message.timestamp}</p>
                    </div>
                  </div>
                </div>
                
                {/* Message Details */}
                {message.sender === 'bot' && showDetails && renderMessageDetails(message)}
              </div>
            ))
          )}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-600 rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span className="text-sm text-white">Thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="flex space-x-2 p-4 border-t border-gray-600">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about the position, strategy, or anything chess-related..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-white"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default ChatPanel 