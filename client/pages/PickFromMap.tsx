import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';

type Coordinate = {
  latitude: number;
  longitude: number;
};

type MapPressEvent = {
  nativeEvent: {
    coordinate: Coordinate;
  };
};

export default function PickFromMap() {
  const [selectedLocation, setSelectedLocation] = useState<Coordinate | null>(null);
  const [circleRadius, setCircleRadius] = useState<number>(200); // Adjust the radius as needed

  const handlePress = (e: MapPressEvent) => {
    setSelectedLocation(e.nativeEvent.coordinate);
  };

  return (
    <View style={styles.container}>
      <MapView 
        style={styles.map} 
        onPress={handlePress}
        focusable={true}
      >
        {selectedLocation && (
          <>
            <Marker coordinate={selectedLocation} />
            <Circle
              center={selectedLocation}
              radius={circleRadius}
              strokeColor="rgba(0,0,255,0.5)" // Optional: Stroke color
              fillColor="rgba(0,0,255,0.1)"  // Optional: Fill color
            />
          </>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
