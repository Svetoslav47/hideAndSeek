import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker, Circle } from 'react-native-maps';
import Slider from '@react-native-community/slider';
import Button from '../components/Button';

import { StackNavigationProp } from "@react-navigation/stack";
import { NavStackParamList } from "../components/Navigation";

type Coordinate = {
  latitude: number;
  longitude: number;
};

type MapPressEvent = {
  nativeEvent: {
    coordinate: Coordinate;
  };
};

type PickFromMapProps = {
  navigation: StackNavigationProp<NavStackParamList, "PickFromMap">
};

export default function PickFromMap({navigation} : PickFromMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<Coordinate | null>(null);
  const [circleRadius, setCircleRadius] = useState<number>(200);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    })();
  }, []);

  const handlePress = (e: MapPressEvent) => {
    setSelectedLocation(e.nativeEvent.coordinate);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button onPress={() => {}} icon="ab-testing" color='transparent' stylesProp={{backgroundColor:"#DDDDDD00"}}/>
        <Text style={styles.headerText}>Pick a location</Text>
        <Button onPress={() => navigation.navigate("CreateGame", {
          longitude: selectedLocation?.longitude.toString(),
          latitude: selectedLocation?.latitude.toString(),
          circleRadius: circleRadius.toString()
        })} icon="check" size={24} color="green" stylesProp={{backgroundColor:"#DDD"}} />
      </View>
      {selectedLocation && (
        <MapView 
          style={styles.map} 
          onPress={handlePress}
          focusable={true}
          initialRegion={{
            latitude: selectedLocation?.latitude || 0,
            longitude: selectedLocation?.longitude || 0,
            latitudeDelta: 0.00922,
            longitudeDelta: 0.00422,
          }}
        >
          <Marker coordinate={selectedLocation} />
          <Circle
            center={selectedLocation}
            radius={circleRadius}
            strokeColor="rgba(255,0,255,0.5)" 
            fillColor="rgba(255,0,255,0.1)"
          />
        </MapView>
      )}
      <View style={styles.footer}>
        <Slider
          style={{ width: '100%', height: 40 }}
          minimumValue={100}
          maximumValue={10000}
          step={10}
          value={circleRadius}
          onValueChange={setCircleRadius}
        />
      </View>
    </View>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    paddingTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    backgroundColor: 'transparent',
    top: 0,
    left: 0,
    padding: 10,
    alignItems: 'center',
    zIndex: 100
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  footer: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: 10,
  },
});
