import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { io, Socket } from 'socket.io-client';

import { RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { NavStackParamList } from '../components/Navigation';

// Define the types for the navigation parameters
type GameProps = {
    navigation: StackNavigationProp<NavStackParamList, "Game">
    route: RouteProp<NavStackParamList, 'Game'>;
}

type LocationState = Location.LocationObject | null;

// const serverURL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://192.168.7.129:3001';
const serverURL = 'http://192.168.7.129:3001';

export default function Game({ navigation, route }: GameProps) {
    const { gameID, playerName, password } = route.params;
    const [location, setLocation] = useState<LocationState>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setErrorMsg('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setLocation(location);
        })().catch((e) => {
            setErrorMsg(e.message);
        }
        );
    }, []);

    useEffect(() => {
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

            return () => {
                if (socket) socket.disconnect();
            };
        }
    }, [location]);

    if (errorMsg) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <Text>{errorMsg}</Text>
            </View>
        );
    }

    if (!location) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" />
                <Text>Fetching location...</Text>
            </View>
        );
    }

    

    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text>Game On!</Text>
            <Text>Latitude: {location.coords.latitude}</Text>
            <Text>Longitude: {location.coords.longitude}</Text>
        </View>
    );
}
