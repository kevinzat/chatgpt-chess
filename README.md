**Note**: This is a vibe-coded application. (Just playing with AI.)

# Chess vs ChatGPT

A React-based chess game where you play against ChatGPT. The AI analyzes the position and suggests moves with explanations.

## Features

- Interactive chess board with drag-and-drop moves
- AI-powered opponent using OpenAI's ChatGPT
- Move history with standard chess notation
- ChatGPT explanations for AI moves (click the robot icon)
- Chat panel for asking questions about the position
- Settings panel for configuring OpenAI API key and model

## Architecture

This application uses **direct client-to-OpenAI communication** - no server required! The React frontend communicates directly with OpenAI's API using the user's API key.

## Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd chess
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Get an OpenAI API key**
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key
   - Copy the key (starts with `sk-`)

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Configure your API key**
   - Open the app in your browser
   - Click the settings icon (gear) in the top right
   - Enter your OpenAI API key
   - Choose your preferred model (GPT-4 recommended for best chess analysis)
   - Click Save

## Deployment

Since this is now a static application, you can deploy it to any static hosting service:

### Vercel (Recommended)
1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and create an account
3. Click "New Project" and import your GitHub repository
4. Deploy - no additional configuration needed!

### Netlify
1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com) and create an account
3. Click "New site from Git" and connect your repository
4. Set build command: `npm run build`
5. Set publish directory: `dist`
6. Deploy!

### GitHub Pages
1. Push your code to GitHub
2. Go to repository Settings > Pages
3. Set source to "GitHub Actions"
4. Create a workflow file for building and deploying

### Manual Deployment
1. Build the project: `npm run build`
2. Upload the `dist` folder to any web server

## Security Note

⚠️ **Important**: Your OpenAI API key is stored locally in your browser and sent directly to OpenAI. Never share your API key publicly. The key is only used for your own API calls.

## Usage

1. **Start a game**: The board starts with White to move
2. **Make moves**: Drag and drop pieces to make legal moves
3. **AI responses**: After each of your moves, the AI will respond automatically
4. **View explanations**: Click the robot icon next to AI moves to see ChatGPT's reasoning
5. **Chat**: Use the chat panel to ask questions about the position
6. **Reset**: Click the reset button to start a new game

## Technologies Used

- **Frontend**: React 18, Vite, Tailwind CSS
- **Chess Engine**: chess.js
- **UI Components**: react-chessboard, lucide-react
- **AI**: OpenAI GPT API (direct integration)

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## License

ISC 
