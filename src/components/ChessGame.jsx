import React, { useState, useEffect, useCallback } from 'react'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { RotateCcw, Bot, User, Loader2, Copy, Check, XCircle } from 'lucide-react'

const ChessGame = ({ apiKey, model }) => {
  const [game, setGame] = useState(new Chess())
  const [moveHistory, setMoveHistory] = useState([])
  const [isThinking, setIsThinking] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [gameStatus, setGameStatus] = useState('playing')
  const [aiEnabled, setAiEnabled] = useState(true)
  const [expandedMoves, setExpandedMoves] = useState(new Set())
  const [expandedFen, setExpandedFen] = useState(false)
  const [fenCopied, setFenCopied] = useState(false)

  const makeAMove = useCallback(
    (move) => {
      const gameCopy = new Chess(game.fen())
      const result = gameCopy.move(move)
      setGame(gameCopy)
      return result
    },
    [game]
  )

  const makeAIMove = useCallback(async () => {
    if (!aiEnabled || game.isGameOver() || game.isDraw() || game.turn() === 'w') return

    setIsThinking(true)
    
    // Add a small delay to make the AI thinking visible
    await new Promise(resolve => setTimeout(resolve, 500))

    try {
      const possibleMoves = game.moves()
      if (possibleMoves.length === 0) return

      // Format move history in standard chess notation
      const formattedMoves = []
      for (let i = 0; i < moveHistory.length; i += 2) {
        const moveNumber = Math.floor(i / 2) + 1
        const whiteMove = moveHistory[i]?.san || ''
        const blackMove = moveHistory[i + 1]?.san || ''
        if (whiteMove) {
          formattedMoves.push(`${moveNumber}. ${whiteMove}${blackMove ? ` ${blackMove}` : ''}`)
        }
      }

      // Call ChatGPT for AI move suggestion
      const systemPrompt = `You are a chess expert playing as Black. You must suggest the best move for Black in algebraic notation (e.g., "e5" or "Nf6") and explain your reasoning.

IMPORTANT: Start your response with the move in algebraic notation on its own line, then provide your explanation.`

      const userMessage = `I am playing as Black in a chess game. 
Move history: ${formattedMoves.join(' ')}
Please suggest the best move for Black in algebraic notation (e.g., "e5" or "Nf6") and explain your reasoning.`

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
            { role: 'user', content: userMessage }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const chatgptResponse = data.choices?.[0]?.message?.content || ''

      // Store the original request for debugging
      const requestBody = {
        systemPrompt,
        userMessage,
        model,
        gameState: {
          moveHistory: formattedMoves
        }
      }

      // Extract move from ChatGPT response
      let aiMove = null
      let usedRandomMoveFallback = false
      let fallbackErrorType = null
      if (chatgptResponse) {
        // First, try to get the move from the first line (new format)
        const lines = chatgptResponse.trim().split('\n')
        const firstLine = lines[0].trim()

        const moveMatch = firstLine.match(/\b([a-h][1-8]|[a-h]x[a-h][1-8]|[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8]|[O-O-O]|[O-O])\b/)
        if (!moveMatch) {
          console.log('No move found in first line')
          console.log('ChatGPT response for AI move:', chatgptResponse)
          fallbackErrorType = 'no-move-found'
        } else if (!possibleMoves.includes(moveMatch[1])) {
          console.log('Move ' + firstLine + ' not in possible moves')
          console.log('ChatGPT response for AI move:', chatgptResponse)
          fallbackErrorType = 'not-legal-move'
        } else {
          aiMove = moveMatch[1]
          console.log('Found valid move on first line:', aiMove)
        }
      }

      // Fallback to random move if ChatGPT didn't provide a valid move
      if (!aiMove) {
        const randomIndex = Math.floor(Math.random() * possibleMoves.length)
        aiMove = possibleMoves[randomIndex]
        usedRandomMoveFallback = true
        console.log('Using random move as fallback:', aiMove)
      }
      
      const move = makeAMove(aiMove)
      
      if (move) {
        setMoveHistory(prev => [...prev, { 
          from: move.from, 
          to: move.to, 
          piece: move.piece,
          color: move.color,
          san: move.san,
          isAI: true,
          chatgptResponse: chatgptResponse,
          usedRandomMoveFallback,
          fallbackErrorType,
          requestBody: requestBody
        }])
      }
    } catch (error) {
      console.error('Error making AI move:', error)
      // Fallback to random move on error
      const possibleMoves = game.moves()
      if (possibleMoves.length > 0) {
        const randomIndex = Math.floor(Math.random() * possibleMoves.length)
        const aiMove = possibleMoves[randomIndex]
        const move = makeAMove(aiMove)
        
        if (move) {
          setMoveHistory(prev => [...prev, { 
            from: move.from, 
            to: move.to, 
            piece: move.piece,
            color: move.color,
            san: move.san,
            isAI: true,
            chatgptResponse: 'Error: Using random move as fallback',
            usedRandomMoveFallback: true,
            fallbackErrorType: null,
            requestBody: null
          }])
        }
      }
    } finally {
      setIsThinking(false)
    }
  }, [game, aiEnabled, makeAMove, apiKey, model, moveHistory])

  const onDrop = (sourceSquare, targetSquare) => {
    // Only allow moves if it's the player's turn (White) and AI is not thinking
    if (game.turn() !== 'w' || isThinking) return false

    const move = makeAMove({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q' // always promote to queen for simplicity
    })

    if (move === null) return false

    setMoveHistory(prev => [...prev, { 
      from: sourceSquare, 
      to: targetSquare, 
      piece: move.piece,
      color: move.color,
      san: move.san,
      isAI: false
    }])

    return true
  }

  const resetGame = () => {
    setGame(new Chess())
    setMoveHistory([])
    setGameStatus('playing')
    setExpandedMoves(new Set())
  }

  const toggleMoveExplanation = (moveIndex) => {
    setExpandedMoves(prev => {
      const newSet = new Set(prev)
      if (newSet.has(moveIndex)) {
        newSet.delete(moveIndex)
      } else {
        newSet.add(moveIndex)
      }
      return newSet
    })
  }

  const getGameStatus = () => {
    if (game.isCheckmate()) return 'Checkmate!'
    if (game.isDraw()) return 'Draw!'
    if (game.isStalemate()) return 'Stalemate!'
    if (game.isCheck()) return 'Check!'
    return game.turn() === 'w' ? 'White to move' : 'Black to move'
  }

  // Make AI move after player's move
  useEffect(() => {
    if (aiEnabled && game.turn() === 'b' && !game.isGameOver() && !game.isDraw()) {
      makeAIMove()
    }
  }, [game.turn(), aiEnabled, makeAIMove])

  useEffect(() => {
    setGameStatus(getGameStatus())
  }, [game])

  return (
    <div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Chess Board */}
      <div className="lg:col-span-2">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Chess Board</h2>
            <div className="flex space-x-2">
              <button
                onClick={resetGame}
                className="btn-secondary flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <div className="flex justify-center mb-4">
            <div className="w-full max-w-md">
              <Chessboard
                position={game.fen()}
                onPieceDrop={onDrop}
                boardOrientation="white"
                draggable={true}
                snapToCursor={true}
                customBoardStyle={{
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
              />
            </div>
          </div>

          <div className="text-center space-y-2">
            {isThinking && (
              <div className="inline-flex items-center space-x-2 bg-chess-warning/20 text-chess-warning rounded-lg px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm font-medium">AI is thinking...</span>
              </div>
            )}
            
            <div className="inline-flex items-center space-x-2 bg-white/10 rounded-lg px-4 py-2">
              <span className="text-sm font-medium">Status:</span>
              <span className={`text-sm ${
                gameStatus.includes('Checkmate') ? 'text-chess-error' :
                gameStatus.includes('Draw') ? 'text-chess-warning' :
                gameStatus.includes('Check') ? 'text-chess-warning' :
                'text-chess-success'
              }`}>
                {gameStatus}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Game Info & Chat */}
      <div className="space-y-6">
        {/* Game Info */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Game Info</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Current Turn:</span>
              <div className="flex items-center space-x-2">
                {game.turn() === 'w' ? (
                  <>
                    <User className="w-4 h-4 text-white" />
                    <span className="text-sm">White (You)</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4 text-chess-accent" />
                    <span className="text-sm">Black (AI)</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Moves Made:</span>
              <span className="text-sm font-medium">{moveHistory.length}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">FEN:</span>
              <button
                type="button"
                className="text-xs text-gray-400 font-mono bg-transparent border-none p-0 m-0 truncate max-w-32 hover:text-blue-400 focus:outline-none"
                style={{ maxWidth: '8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                onClick={() => setExpandedFen(f => !f)}
                title={expandedFen ? 'Click to collapse' : 'Click to expand'}
              >
                {game.fen()}
              </button>
            </div>
            {expandedFen && (
              <div className="mt-1 p-2 bg-gray-800/70 rounded text-xs text-blue-300 font-mono break-all flex items-center justify-between">
                <span>{game.fen()}</span>
                <button
                  type="button"
                  className="ml-2 p-1 rounded hover:bg-gray-700 transition-colors"
                  onClick={async () => {
                    await navigator.clipboard.writeText(game.fen())
                    setFenCopied(true)
                    setTimeout(() => setFenCopied(false), 1200)
                  }}
                  title="Copy FEN to clipboard"
                >
                  {fenCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-blue-300" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Move History */}
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Move History</h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {moveHistory.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">
                No moves yet
              </p>
            ) : (
              Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, turnIndex) => {
                const whiteMove = moveHistory[turnIndex * 2]
                const blackMove = moveHistory[turnIndex * 2 + 1]
                const blackMoveIndex = turnIndex * 2 + 1
                return (
                  <div key={turnIndex} className="space-y-1">
                    <div className="grid grid-cols-3 gap-2 items-center text-sm">
                      <span className="text-gray-300 text-center">{turnIndex + 1}.</span>
                      <span className="font-mono flex items-center justify-center space-x-1 min-h-[1.5em]">
                        {whiteMove ? <><span>{whiteMove.san}</span><User className="w-3 h-3 text-white" /></> : null}
                      </span>
                      <span className="font-mono flex items-center justify-center space-x-1 min-h-[1.5em]">
                        {blackMove ? <>
                          <span>{blackMove.san}</span>
                          <button
                            type="button"
                            className={`focus:outline-none ${blackMove.isAI && blackMove.chatgptResponse ? 'cursor-pointer' : 'cursor-default'}`}
                            onClick={() => {
                              if (blackMove.isAI && blackMove.chatgptResponse) toggleMoveExplanation(blackMoveIndex)
                            }}
                            tabIndex={blackMove.isAI && blackMove.chatgptResponse ? 0 : -1}
                            aria-label="Show/Hide ChatGPT explanation"
                          >
                            {blackMove.usedRandomMoveFallback ? (
                              <XCircle className="w-4 h-4 text-red-500 hover:scale-125 transition-transform" />
                            ) : (
                              <Bot className={`w-3 h-3 text-chess-accent ${blackMove.isAI && blackMove.chatgptResponse ? 'hover:scale-125 transition-transform' : ''}`} />
                            )}
                          </button>
                        </> : null}
                      </span>
                    </div>
                    {/* Explanations for AI (black) move, toggled by Bot icon */}
                    {blackMove && blackMove.isAI && blackMove.chatgptResponse && expandedMoves.has(blackMoveIndex) && (
                      <div className="ml-8">
                        <div className="text-xs text-gray-400 bg-gray-800/50 rounded p-2 mt-1">
                          <div className="font-medium text-chess-accent mb-1 flex items-center gap-2">
                            {!blackMove.usedRandomMoveFallback && (
                              <span>ChatGPT:</span>
                            )}
                            {blackMove.usedRandomMoveFallback && blackMove.fallbackErrorType === 'no-move-found' && (
                              <span>ChatGPT <span className="text-xs text-red-400">(does not start with a move)</span>:</span>
                            )}
                            {blackMove.usedRandomMoveFallback && blackMove.fallbackErrorType === 'not-legal-move' && (
                              <span>ChatGPT <span className="text-xs text-red-400">(not a legal move)</span>:</span>
                            )}
                          </div>
                          <div className="text-gray-300">{blackMove.chatgptResponse}</div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
  )
}

export default ChessGame 