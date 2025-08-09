// Simple test script to verify API connection
// Run this in the browser console to test the API

const API_BASE_URL = 'http://localhost:8000';

async function testAPI() {
  try {
    console.log('Testing API connection...');
    
    // Test games endpoint
    const gamesResponse = await fetch(`${API_BASE_URL}/api/games/`);
    const gamesData = await gamesResponse.json();
    console.log('Games API response:', gamesData);
    
    // Test players endpoint
    const playersResponse = await fetch(`${API_BASE_URL}/api/players/`);
    const playersData = await playersResponse.json();
    console.log('Players API response:', playersData);
    
    // Test roles endpoint
    const rolesResponse = await fetch(`${API_BASE_URL}/api/roles/`);
    const rolesData = await rolesResponse.json();
    console.log('Roles API response:', rolesData);
    
    console.log('✅ API connection successful!');
    return true;
  } catch (error) {
    console.error('❌ API connection failed:', error);
    return false;
  }
}

// Export for use in components
export { testAPI }; 