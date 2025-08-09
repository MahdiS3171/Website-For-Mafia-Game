#!/usr/bin/env python
"""
Django management script to set up initial data for the Mafia game.
Run this script to create sample roles and players for testing.
"""

import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mafia_log.settings')
django.setup()

from roles.models import Role
from players.models import Player

def create_roles():
    """Create default roles for the Mafia game."""
    roles_data = [
        # Mafia Roles
        {
            'name': 'Godfather',
            'description': 'Decides the night kill',
            'is_mafia': True,
            'order': 1
        },
        {
            'name': 'Punisher',
            'description': 'Punishes a Player during the night',
            'is_mafia': True,
            'order': 2
        },
        {
            'name': 'Attorney',
            'description': 'Defends a Mafia player',
            'is_mafia': True,
            'order': 3
        },
        {
            'name': 'Terrorist',
            'description': 'terrors a player during the day',
            'is_mafia': True,
            'order': 4
        },
        {
            'name': 'Killer',
            'description': 'Kills a Player during the night',
            'is_mafia': True,
            'order': 5
        },
        {
            'name': 'Simple Mafia',
            'description': 'a normal mafia player',
            'is_mafia': True,
            'order': 6
        },
        # Citizen Roles
        {
            'name': 'Doctor',
            'description': 'Saves two players during night',
            'is_mafia': False,
            'order': 7
        },
        {
            'name': 'No Face',
            'description': 'Takes the role of another player',
            'is_mafia': False,
            'order': 8
        },
        {
            'name': 'Boozer',
            'description': 'can Boo a player during the night so he cannot use his ability',
            'is_mafia': False,
            'order': 9
        },
        {
            'name': 'Sniper',
            'description': 'tries to shoot the mafia players',
            'is_mafia': False,
            'order': 10
        },
        {
            'name': 'Simple Citizen',
            'description': 'a normal Citizen player',
            'is_mafia': False,
            'order': 11
        }
    ]
    
    created_roles = []
    for role_data in roles_data:
        role, created = Role.objects.get_or_create(
            name=role_data['name'],
            defaults=role_data
        )
        if created:
            created_roles.append(role)
            print(f"✅ Created role: {role.name}")
        else:
            print(f"ℹ️  Role already exists: {role.name}")
    
    return created_roles

def create_sample_players():
    """Create sample players for testing."""
    players_data = [
        {'name': 'John Doe', 'nickname': 'John'},
        {'name': 'Jane Smith', 'nickname': 'Jane'},
        {'name': 'Mike Johnson', 'nickname': 'Mike'},
        {'name': 'Sarah Wilson', 'nickname': 'Sarah'},
        {'name': 'David Brown', 'nickname': 'David'},
        {'name': 'Emily Davis', 'nickname': 'Emily'},
        {'name': 'Robert Miller', 'nickname': 'Rob'},
        {'name': 'Lisa Garcia', 'nickname': 'Lisa'},
    ]
    
    created_players = []
    for player_data in players_data:
        player, created = Player.objects.get_or_create(
            name=player_data['name'],
            defaults=player_data
        )
        if created:
            created_players.append(player)
            print(f"✅ Created player: {player.name} ({player.nickname})")
        else:
            print(f"ℹ️  Player already exists: {player.name}")
    
    return created_players

def main():
    """Main function to set up initial data."""
    print("🚀 Setting up initial data for Mafia Game...")
    print()
    
    # Create roles
    print("📋 Creating roles...")
    roles = create_roles()
    print()
    
    # Create sample players
    print("👥 Creating sample players...")
    players = create_sample_players()
    print()
    
    # Summary
    print("📊 Setup Summary:")
    print(f"   - Roles created: {len(roles)}")
    print(f"   - Players created: {len(players)}")
    print()
    print("✅ Setup complete! You can now use the application.")
    print()
    print("Next steps:")
    print("1. Start the Django server: python manage.py runserver")
    print("2. Start the React frontend: npm run dev (in frontend directory)")
    print("3. Open http://localhost:5173 in your browser")

if __name__ == '__main__':
    main() 