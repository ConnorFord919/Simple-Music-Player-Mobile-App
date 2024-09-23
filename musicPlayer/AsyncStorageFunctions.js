import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAYLISTS_KEY = '@playlists';

// Function to save the collection of playlists to AsyncStorage
export const savePlaylists = async (playlists) => {
  try {
    const jsonValue = JSON.stringify(playlists);
    await AsyncStorage.setItem(PLAYLISTS_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving playlists:', e);
  }
};

// Function to load the collection of playlists from AsyncStorage
export const loadPlaylists = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(PLAYLISTS_KEY);
    if(jsonValue !== null){
      return Array.isArray(JSON.parse(jsonValue)) ? JSON.parse(jsonValue) : [JSON.parse(jsonValue)];
    } else return [];

  } catch (e) {
    console.error('Error loading playlists:', e);
    return [];

  }
};

// Function to add a new playlist to the collection
export const addPlaylist = async (playlist) => {
  try {
    const playlists = await loadPlaylists();
    //playlists is not an array
    console.log(playlists)
    playlists.push(playlist);
    await savePlaylists(playlists);
  } catch (e) {
    console.error('Error adding playlist', e);
  }
};

// Function to remove a playlist from the collection
export const removePlaylist = async (playlistName) => {
  const playlists = await loadPlaylists();
  const updatedPlaylists = playlists.filter(p => p.name !== playlistName);
  await savePlaylists(updatedPlaylists);
};

export const addToPlaylist = async (playlistName, song) => {
  const playlists = await loadPlaylists();
  const targetPlaylist = playlists.find(p => p.name === playlistName);
  targetPlaylist.songs.push(song);
  console.log(targetPlaylist.songs)
  await savePlaylists(targetPlaylist);
}

export const removeFromPlaylist = () => {
    
}
