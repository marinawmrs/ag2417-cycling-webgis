import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Provider as PaperProvider, DarkTheme as PaperDark, DefaultTheme as PaperLight } from "react-native-paper";
import MapScreen from './screens/MapScreen';


export default function HomeScreen() {
    const [darkMode, setDarkMode] = React.useState(false);

    return (
        <PaperProvider theme={darkMode ? PaperDark : PaperLight}>
            <MapScreen nightMode={darkMode} setNightMode={setDarkMode} />
        </PaperProvider>
    );

}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
  },
});
