import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';

import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { NavStackParamList } from '../components/Navigation';

import MapView, { Marker, Circle } from 'react-native-maps';

import * as TaskManager from 'expo-task-manager';

type Player = {
    playerID: string;
    playerName: string;
    longitude: number;
    latitude: number;
    isSeeker: boolean;
};

type Game = {
    gameID: string;
    gameName: string;
    isGamePrivate: boolean;
    password: string;
    gameAdmin: string; // playerID
    centerLongitude: number;
    centerLatitude: number;
    circleRadius: number;
    players: Player[];
    seekers: string[];
  
    timeUntilStart: number;
    timeUntilEnd: number;
  };
type LocationState = Location.LocationObject | null;





const serverURL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.7.129:3001';
type GameProps = {
    navigation: StackNavigationProp<NavStackParamList, "Game">
    route: RouteProp<NavStackParamList, 'Game'>;
}
export default function Game({ navigation, route }: GameProps) {
    const { gameID, playerName, password } = route.params;
    const [currentLocation, setCurrentLocation] = useState<LocationState>(null);
    const [game, setGame] = useState<Game | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);

    const [region, setRegion] = useState({
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.00922,
        longitudeDelta: 0.00421,
    });

    const currentPlayer = useRef<Player | null>(null);

    TaskManager.defineTask('fetchLocation', ({ data, error }: { data: any, error: any }) => {
        if (error) {
            console.error(error);
            return;
        }
        if (data) {
            const { locations } = data;
            if (!locations) return;
            // console.log('Locations:', locations);

            setCurrentLocation(locations[0]);
        }
    });

    async function getLocation() {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            await setErrorMsg('Permission to access location was denied');
            return;
        }
        let { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
            await setErrorMsg('Permission to access location was denied');
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setCurrentLocation(location);
    
        await Location.startLocationUpdatesAsync('fetchLocation', {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 1000,
            foregroundService: {
                notificationTitle: 'Hide and Seek',
                notificationBody: 'Hide and Seek is using your location to play the game.',
                notificationColor: '#FF0000'
            }
        });
        return location;
    }


    function disconnectSocket() {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setErrorMsg('Disconnected from server');
        }
    }

    async function reload() {
        getLocation();
        if (socket) {
            await socket.connect();
        }
        setErrorMsg(null);
    }

    useEffect(() => {
        if (socket && currentLocation) {
            socket?.emit('updateLocation', {
                longitude: currentLocation?.coords.longitude,
                latitude: currentLocation?.coords.latitude
            });
        }
    }, [currentLocation]);

    useEffect(() => {
        async function init() {
            const location = await getLocation();

            if (location && !socket) {
                const socket = io(`${serverURL}`, {
                    query: {
                        gameID,
                        playerName,
                        longitude: location.coords.longitude.toString(),
                        latitude: location.coords.latitude.toString(),
                        password
                    }
                });

                setSocket(socket);
                console.log('Connected to server', serverURL);

                socket.on('joinGameError', (data: { error: string }) => {
                    setErrorMsg(data.error);
                });

                socket.on("connect_error", (err: Error) => {
                    console.error(`[client]: ${err.message}`);
                    setErrorMsg(err.message);
                });

                socket.on('gameJoined', (data: {
                    game: Game,
                    player: Player
                }) => {
                    setGame(data.game);
                    currentPlayer.current = data.player;
                });

                socket.on("timeUpdate", (data: { game : Game }) => {
                    setGame(data.game);
                });
            }
        }
        init();
        return () => {
            disconnectSocket();
        };
    }, []);

    if (errorMsg) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>{errorMsg}</Text>
                <TouchableOpacity onPress={navigation.goBack}>
                    <Text>Go back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!currentLocation) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
                <Text>Fetching location...</Text>
            </View>
        );
    }

    if (!socket || !game) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
                <Text>Connecting to server...</Text>
            </View>
        );
    }

    const customStyles = [
        {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "poi.business",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "poi.park",
            elementType: "labels.text",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "poi.place_of_worship",
            elementType: "labels.text",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "poi.school",
            elementType: "labels.text",
            stylers: [{ visibility: "off" }]
        },
        {
            featureType: "poi.sports_complex",
            elementType: "labels.text",
            stylers: [{ visibility: "off" }]
        }
    ];

    const getScale = (latitudeDelta: number) => {
        const initialDeltaLat = 0.00922; // arbitrary initial latitude delta

        const zoomlevel = initialDeltaLat / latitudeDelta;
        
        return zoomlevel;
    };


    return (
        <>
            <MapView style={{ flex: 1 }} initialRegion={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.00922,
                longitudeDelta: 0.00422,
            }}
                customMapStyle={customStyles}
                followsUserLocation={true}
                pitchEnabled={false}
                toolbarEnabled={false}
                showsCompass={false}
                showsScale={false}
                mapType="standard"
                onRegionChange={(region) => {
                    setRegion(region);
                }}
                //set region to the initial region when the map is rendered
                onMapReady={() => {
                    setRegion({
                        latitude: currentLocation.coords.latitude,
                        longitude: currentLocation.coords.longitude,
                        latitudeDelta: 0.00922,
                        longitudeDelta: 0.00422
                    });
                }}
            >
                {currentPlayer.current &&
                    <Marker key="currentLocation" coordinate={{ latitude: currentLocation.coords.latitude, longitude: currentLocation.coords.longitude }}>
                        <View style={{
                            height: 5 * getScale(region.latitudeDelta), // Scale size based on latitudeDelta
                            width: 5 * getScale(region.latitudeDelta),
                            backgroundColor: 'blue',
                            borderRadius: 10 * getScale(region.latitudeDelta),
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}>
                            <Text style={{
                                color: 'white',
                                fontSize: 2.5 * getScale(region.latitudeDelta)
                            }}>
                                {currentPlayer.current.playerName.charAt(0)}
                            </Text>
                        </View>
                    </Marker>
                }
                <Circle
                    center={{ latitude: game?.centerLatitude || 0, longitude: game?.centerLongitude || 0 }}
                    radius={game?.circleRadius || 0}
                    fillColor="rgba(255, 255, 255, 0)"
                    strokeColor="rgba(0, 0, 0, 0.5)"
                />
            </MapView>
            <Text style={{
                position: 'absolute',
                top: 40,
                left: 10,

            }}>Game ID: {gameID}</Text>

            <Text style={{
                position: 'absolute',
                top: 60,
                left: 10,

            }}>Player Name: {playerName}</Text>

            <Text style={{
                position: 'absolute',
                top: 80,
                left: 10,
            }}>
            Location: {currentLocation.coords.latitude}, {currentLocation.coords.longitude}</Text>

            {game && <Text style={{
                position: 'absolute',
                top: 100,
                left: 10,
            }}>Time until start: {game.timeUntilStart}</Text>}
        </>
    );
}
