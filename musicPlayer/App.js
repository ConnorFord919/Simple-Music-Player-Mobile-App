import { View, StyleSheet, Text, SafeAreaView, FlatList, Image, Button, Alert, ScrollView, TouchableOpacity, TouchableHighlight, TouchableOpacityBase, TouchableNativeFeedbackBase, TouchableWithoutFeedback, TextInput, Modal} from 'react-native';
import { useState, useEffect, useRef} from 'react';
import * as MediaLibrary from 'expo-media-library';
import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from "expo-av";
import Slider from '@react-native-community/slider';
import { clearTextBox, savePlaylists, loadPlaylists, addPlaylist, removePlaylist, addToPlaylist, removeFromPlaylist} from './AsyncStorageFunctions';

const filterTitles = (title) => {
  if(title){
    let updatedName = title.replace('Y2meta.app - ', '');
    return updatedName.replace('.mp3', '');
  }
  else return title
}

const AudioBar = ({pauseOrPlayAudio, audioPaused, currentSongName, currentSong}) => {
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  currentSong.setOnPlaybackStatusUpdate((status) => {
    if (status.isLoaded) {
      setPosition(status.positionMillis);
      setDuration(status.durationMillis);
    }
    if (status.didJustFinish) {
      setPosition(0);
    }
  });

  const jump = async (interval) => {
    const status = await currentSong.getStatusAsync();
    await currentSong.setPositionAsync(status.positionMillis + (interval * 1000));
  }
  const handleSliderValueChange = async (value) => {
    if (currentSong) {
      const seekPosition = value * duration;
      await currentSong.setPositionAsync(seekPosition);
      setPosition(seekPosition);
    }
  };
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds) % 60;
    return `${minutes.toString()}:${seconds.toString().padStart(2, '0')}`;
  };
  useEffect(() => {
    const interval = setInterval(async () => {
      if (currentSong) {
        const status = await currentSong.getStatusAsync();
        if (status.isLoaded) {
          setPosition(status.positionMillis);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSong]);
  return(
      <View style={styles.audioBar}>
        <Text style={{textAlign: 'center', fontWeight: 'bold'}} >Currently Playing</Text>
        <Text style={styles.songTitle} >{filterTitles(currentSongName)}</Text>
        <Text style={{marginLeft: 15}} >{`${formatTime(position/1000)} / ${formatTime(duration / 1000)}`}</Text>
        <Slider
          style={styles.progressBar}
          value={duration ? position / duration : 0}
          onValueChange={handleSliderValueChange}
          minimumTrackTintColor="#1EB1FC"
          maximumTrackTintColor="#8ED1FC"
          thumbTintColor="#1EB1FC"
        />
        <View style={styles.mainControls} >
          <Button title='-10' onPress={() => jump(-10)} />
          <TouchableWithoutFeedback onPress={() => pauseOrPlayAudio()} >
            <Image style={styles.btnPausePlay} source={audioPaused ? require('./assets/play.png') : require('./assets/pause.jpg')} />
          </TouchableWithoutFeedback>
          <Button title='+10' onPress={() => jump(10)} />
        </View>
      </View>
  )
  
}

const PlaylistView = ({songs, currentSong, setCurrentSong, setCurrentSongName, setAudioPaused}) => {
  
  const [playlists, setPlaylists] = useState([]);
  const [addPlayListFormVisible, setAddPlayListFormVisible] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playListModal, setPlayListModal] = useState(undefined);
  const [addSongFormVisible, setAddSongFormVisible] = useState(false);

  useEffect(() => {
    const dismountSong = async () => {
      if(currentSong){
        await currentSong.unloadAsync();
      }
      setCurrentSong(undefined)
    }
    const fetchPlaylists = async () => {
      const loadedPlaylists = await loadPlaylists();
      setPlaylists(loadedPlaylists);
    };
    fetchPlaylists();
    dismountSong();
  })
  return (
    <View style={styles.mySongsHeader} >
        <Text>My Playlists</Text>
        <Button title='Add Playlist' onPress={() => setAddPlayListFormVisible(true)} />
        <FlatList
          style={{backgroundColor: 'green'}}
          data={playlists}
          keyExtractor={(item) => item.name}
          renderItem={({ item }) => (
            <View style={styles.playlistItem}>
              <Text>{item.name}</Text>
              <Button title='Edit Playlist' onPress={() => setPlayListModal(item.name)} />
            </View>
          )}
        />
        {addPlayListFormVisible && 
          <View style={{backgroundColor: 'red', padding:10}}>
            <TextInput
              style={styles.textBox}
              placeholder="Playlist Title"
              value={playlistName}
              onChangeText={setPlaylistName}
            />
            <Button title="Add Playlist" onPress={() => {addPlaylist({name: playlistName, songs: []}); setPlaylistName('')}} />
          </View>
        }
        <Modal onRequestClose={() => setPlayListModal(undefined)} visible={playListModal !== undefined}>
          <View style={styles.playListModal} >
            <Button title='Close' onPress={() => setPlayListModal(undefined)} />
            <Button title="Add To Playlist" onPress={() => {setAddPlayListFormVisible(true)}} />
            <Button title="Delete Playlist" onPress={() => {removePlaylist(playListModal); setPlayListModal(undefined)}}/>
          </View>
        </Modal>
        <Modal onRequestClose={() => setAddSongFormVisible(false)} visible={addSongFormVisible} >
          <AddSongForm playlist={playListModal} songs={songs} />
        </Modal>
      </View>
  )
}
const AddSongForm = ({playlist, songs}) => {
  return(
    <View>
      <Text>Add Song to {playlist}</Text>
      <FlatList 
          data={songs}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.2} style={styles.songCard} onPress={() => selectSong(item)}> 
              <Text>{filterTitles(item.filename)}</Text>
              <Button title='Add Song' onPress={() => addToPlaylist(playlist, item)} />
            </TouchableOpacity>
          )}
        />
    </View>
  )
}

const SongView = ({songs, currentSong, setCurrentSong, setCurrentSongName, setAudioPaused}) => {
  const selectSong = async (song) => {
    if(currentSong){
      await currentSong.unloadAsync();
    }
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: song.uri },
      { shouldPlay: true },
    );
    setAudioPaused(false);
    setCurrentSongName(song.filename)
    setCurrentSong(newSound);
  }
  return (
    <View >
        <Text style={styles.mySongsHeader} >My Songs</Text>
        <FlatList 
          style={currentSong ? styles.songList : {height: '86%'}}
          data={songs}
          contentContainerStyle={{}}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.2} style={styles.songCard} onPress={() => selectSong(item)}> 
              <Text style={styles.songTitle} >{filterTitles(item.filename)}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
  )
}

export default function App() {
  const [songs, setSongs] = useState([]);
  const [currentSong, setCurrentSong] = useState();
  const [currentSongName, setCurrentSongName] = useState();
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [audioPaused, setAudioPaused] = useState(false);

  const filterMedia = (media) => {
    const files = [...media.assets];
    return files.filter(file => file.filename.split('.').pop() === 'mp3');
  }
  const pauseOrPlayAudio = async () => {
    if(!audioPaused){
      await currentSong.pauseAsync();
      setAudioPaused(true);
    } 
    else{
      await currentSong.playAsync()
      setAudioPaused(false);
    }
    
  }

  const getPermission = async () => {
    const permission = await MediaLibrary.getPermissionsAsync();
    if(permission.granted){
      const media = await MediaLibrary.getAssetsAsync({
        mediaType: 'audio',
      });
      const filteredMedia = filterMedia(media);
      setSongs(filteredMedia);
    }
    else if(!permission.granted && permission.canAskAgain){
      const {status, canAskAgain} = await MediaLibrary.requestPermissionsAsync();
      if(status === 'denied' && !canAskAgain){
        Alert.alert("You cannot use this app without the provided permissions");
      }
    }
  }
  useEffect(() => {
    Audio.setAudioModeAsync({
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      interruptionModeIOS: InterruptionModeIOS.DuckOthers,
      interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: true,
    });
    getPermission();
  }, [])
  
  return (
    <SafeAreaView style={styles.main}>
      <View style={styles.header} >
        <TouchableWithoutFeedback onPress={() => {setShowPlaylists(true)}} >
          <Image 
            style={styles.icon}
            source={require('./assets/playlist.png')} 
          />
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={() => {setShowPlaylists(false)}}  >
          <Image 
            style={styles.icon}
            source={require('./assets/allSongs.png')}
          />
        </TouchableWithoutFeedback>
      </View>
      {showPlaylists ? 
        <PlaylistView setAudioPaused={setAudioPaused} setCurrentSongName={setCurrentSongName} currentSong={currentSong} setCurrentSong={setCurrentSong} songs={songs} /> :
        <SongView setAudioPaused={setAudioPaused} setCurrentSongName={setCurrentSongName} currentSong={currentSong} setCurrentSong={setCurrentSong} songs={songs} />
      }
      {(currentSong) &&
        <AudioBar currentSong={currentSong} currentSongName={currentSongName} audioPaused={audioPaused} setAudioPaused={setAudioPaused} pauseOrPlayAudio={pauseOrPlayAudio} />
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  main: {
    flex: 1,
    backgroundColor: 'white',
    width: '100%',
    height: '100%'
  },
  header: {
    width: '100%',
    height: 100,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: "flex-end",
    padding: 5,
    backgroundColor:'#72A0C1',
  },
  playListHeader: {
    backgroundColor: "green",
    padding : 20
  },
  topSongsHeader : {
    backgroundColor: "blue",
    padding : 20
  },
  mySongsHeader: {
    padding : 20
  }, 
  songTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  }, 
  songCard: {
    width: '100%',
    height: 100,
    backgroundColor: '#fff',
    padding:10,
    borderStyle: 'solid',
    borderColor: 'black',
    borderWidth: 2
  },
  icon: {
    width:50,
    height:50,
  },
  songList : {
    height:'52%',
    paddingHorizontal: 0,
    margin: 0,
    width: '100%'
  },
  btnPausePlay : {
    width : 50,
    height: 50
  }, 
  mainControls : {
    flexDirection: 'row',
    justifyContent: 'space-around', // Adjust this as needed (e.g., 'flex-start', 'center', 'space-around')
    alignItems: 'center', // Adjust this as needed (e.g., 'flex-start', 'flex-end')
    padding: 10,
  },
  songTitle: {
    textAlign: 'center', 
    fontWeight: 'bold', 
    fontSize: 18, 
    margin: 10
  },
  textBox: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
});
