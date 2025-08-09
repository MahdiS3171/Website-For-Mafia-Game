# Mafia Game Website

A full-stack web application for managing Mafia game sessions, built with Django (backend) and React (frontend).

## Project Structure

```
Website-For-Mafia-Game/
├── backend/                 # Django backend
│   ├── mafia_log/          # Main Django project
│   ├── games/              # Games app
│   ├── players/            # Players app
│   ├── roles/              # Roles app
│   ├── logs/               # Logs app
│   ├── actions/            # Actions app
│   └── requirements.txt    # Python dependencies
└── frontend/               # React frontend
    ├── src/
    │   ├── components/     # React components
    │   ├── pages/          # Page components
    │   ├── hooks/          # Custom hooks
    │   ├── services/       # API services
    │   └── types/          # TypeScript types
    └── package.json        # Node.js dependencies
```

## Features

### Backend (Django)
- **Games Management**: Create, view, and manage Mafia game sessions
- **Player Management**: Add and manage players with names and nicknames
- **Role Management**: Define game roles (Mafia, Citizen, etc.)
- **Game Players**: Assign players to games with specific roles and seat numbers
- **Actions & Logs**: Track game actions and maintain detailed logs
- **REST API**: Full REST API for frontend integration

### Frontend (React)
- **Modern UI**: Built with React, TypeScript, and Tailwind CSS
- **Real-time Data**: Uses React Query for efficient data fetching and caching
- **Responsive Design**: Works on desktop and mobile devices
- **Game Management**: View all games, create new games, and manage game sessions
- **Player Management**: Add new players to the system

## Prerequisites

- Python 3.8+ (for Django backend)
- Node.js 16+ (for React frontend)
- pip (Python package manager)
- npm or yarn (Node.js package manager)

## Installation & Setup

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment (recommended):**
   ```bash
   python -m venv venv
   
   # On Windows:
   venv\Scripts\activate
   
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

5. **Create a superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start the Django development server:**
   ```bash
   python manage.py runserver
   ```

The backend will be available at `http://localhost:8000`

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## API Endpoints

The Django backend provides the following REST API endpoints:

### Games
- `GET /api/games/` - List all games
- `POST /api/games/` - Create a new game
- `GET /api/games/{id}/` - Get game details
- `PUT /api/games/{id}/` - Update game
- `DELETE /api/games/{id}/` - Delete game

### Players
- `GET /api/players/` - List all players
- `POST /api/players/` - Create a new player
- `GET /api/players/{id}/` - Get player details
- `PUT /api/players/{id}/` - Update player
- `DELETE /api/players/{id}/` - Delete player

### Roles
- `GET /api/roles/` - List all roles
- `POST /api/roles/` - Create a new role
- `GET /api/roles/{id}/` - Get role details
- `PUT /api/roles/{id}/` - Update role
- `DELETE /api/roles/{id}/` - Delete role

### Game Players
- `GET /api/game-players/` - List all game players
- `GET /api/game-players/?game={gameId}` - Get players for a specific game
- `POST /api/game-players/` - Add player to game
- `PUT /api/game-players/{id}/` - Update game player
- `DELETE /api/game-players/{id}/` - Remove player from game

### Actions
- `GET /api/actions/` - List all actions
- `GET /api/actions/?game={gameId}` - Get actions for a specific game
- `POST /api/actions/` - Create a new action
- `PUT /api/actions/{id}/` - Update action
- `DELETE /api/actions/{id}/` - Delete action

### Logs
- `GET /api/logs/` - List all logs
- `GET /api/logs/?game={gameId}` - Get logs for a specific game
- `POST /api/logs/` - Create a new log
- `PUT /api/logs/{id}/` - Update log
- `DELETE /api/logs/{id}/` - Delete log

## Usage

### Starting Both Servers

1. **Start the backend server:**
   ```bash
   cd backend
   python manage.py runserver
   ```

2. **In a new terminal, start the frontend server:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Open your browser and navigate to:**
   ```
   http://localhost:5173
   ```

### Basic Workflow

1. **Add Players**: Use the "Add Player" page to add players to the system
2. **Create Games**: Use the "Create Game" page to start a new Mafia game
3. **Manage Games**: View all games and manage ongoing sessions
4. **Track Actions**: Record game actions and maintain logs

## Development

### Backend Development

- The Django backend uses SQLite as the default database
- All models are in their respective app directories
- API viewsets are automatically generated using Django REST Framework
- CORS is configured to allow frontend requests

### Frontend Development

- Built with React 18 and TypeScript
- Uses React Query for data fetching and caching
- Styled with Tailwind CSS and shadcn/ui components
- All API calls are centralized in the `services/api.ts` file

### Adding New Features

1. **Backend**: Add models, serializers, and viewsets in the appropriate Django app
2. **Frontend**: Add TypeScript interfaces, API services, and React components
3. **Integration**: Update the API hooks and components to use the new endpoints

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the Django backend is running and CORS is properly configured
2. **API Connection**: Verify the API base URL in `frontend/src/services/api.ts`
3. **Database Issues**: Run `python manage.py migrate` to ensure all migrations are applied
4. **Port Conflicts**: Change the port in the respective configuration files if needed

### Backend Issues

- Check Django logs for detailed error messages
- Ensure all dependencies are installed: `pip install -r requirements.txt`
- Verify database migrations: `python manage.py showmigrations`

### Frontend Issues

- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check browser console for JavaScript errors
- Verify API endpoints are accessible

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both backend and frontend
5. Submit a pull request

## License

This project is open source and available under the MIT License. 