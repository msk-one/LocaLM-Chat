# LocalLM Chat

A modern, production-ready Vue.js 3 application for interacting with locally-hosted Large Language Models through Docker Model Runner.

## Features

- 🚀 **Real-time Chat Interface** - Stream responses from your local LLMs
- 📄 **Document Support** - Upload and chat about PDF, DOCX, TXT, and Markdown files
- 💾 **Conversation History** - Save and revisit your conversations
- 🎨 **Modern UI** - Beautiful, responsive design with smooth animations
- 🧠 **Thinking Process Display** - Collapsible view for LLM reasoning (when using `<think>` tags)
- 🔄 **Auto-refresh** - Automatic model availability checking
- 🎯 **Multiple Models** - Support for Qwen3, DeepSeek R1, Mistral, and more
- 🐳 **Docker Ready** - Easy deployment with Docker Compose

## Tech Stack

- **Frontend**: Vue.js 3, TypeScript, Tailwind CSS, Vite
- **State Management**: Pinia
- **Routing**: Vue Router
- **HTTP Client**: Axios
- **Document Processing**: PDF.js, Mammoth.js
- **Testing**: Vitest, Playwright
- **Deployment**: Docker, Docker Compose

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Docker Model Runner configured with your preferred LLMs

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vue-llm-chat
```

2. Install dependencies:
```bash
npm install
cd proxy && npm install && cd ..
```

3. Configure environment variables:
```bash
cp .env.example .env
cp proxy/.env.example proxy/.env
```

4. Update the `.env` files with your configuration:
- `VITE_API_URL`: URL of your proxy server (default: http://localhost:3001)
- `DOCKER_MODEL_RUNNER_URL`: URL of your Docker Model Runner (default: http://localhost:8080)

## Development

1. Start the proxy server:
```bash
cd proxy && npm run dev
```

2. In a new terminal, start the Vue development server:
```bash
npm run dev
```

3. Open http://localhost:3000 in your browser

## Production Deployment

### Using Docker Compose

1. Build and start the containers:
```bash
docker-compose up -d
```

2. Access the application at http://localhost:3000

### Manual Build

1. Build the application:
```bash
npm run build
```

2. The built files will be in the `dist` directory

## Usage

1. **Start a Conversation**: Click "Start New Conversation" or use the + button
2. **Select a Model**: Choose your preferred LLM from the dropdown
3. **Chat**: Type your message and press Enter to send
4. **Upload Documents**: Click the attachment icon to upload documents for context
5. **View History**: Access previous conversations from the history page
6. **Settings**: Configure API endpoints, auto-refresh, and manage data

## Features in Detail

### Thinking Process Display
When an LLM wraps its reasoning in `<think>` tags, the interface will:
- Hide the thinking content by default
- Provide a toggle to show/hide the reasoning
- Display only the final response prominently

### Document Support
- Supports PDF, DOCX, TXT, and Markdown files
- Automatically chunks documents for context
- Intelligent chunk selection based on relevance

### Auto-refresh
- Configurable intervals (30s, 1min, 5min)
- Automatic model availability checking
- Manual refresh option in settings

## Testing

Run unit tests:
```bash
npm run test:unit
```

Run E2E tests:
```bash
npm run test:e2e
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with Vue.js 3 and the amazing Vue ecosystem
- Designed for use with Docker Model Runner
- Inspired by the need for better local LLM interfaces
