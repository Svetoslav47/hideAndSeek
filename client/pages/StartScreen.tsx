import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { StackNavigationProp } from "@react-navigation/stack";
import { NavStackParamList } from "../components/Navigation";
import * as Location from 'expo-location';

type StartScreenProps = {
    navigation: StackNavigationProp<NavStackParamList, "StartScreen">
}

export default function StartScreen({ navigation }: StartScreenProps) {
    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                alert('Permission to access location was denied');
                return;
            }
        })();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Hide and seek</Text>
            <View style={styles.buttonContainer}>
                <TouchableOpacity style={styles.button} onPress={() => { navigation.navigate("StartGame")}}>
                    <Text>Start Game</Text>
                </TouchableOpacity >
                <TouchableOpacity style={styles.button} onPress={() => { navigation.navigate("JoinGame")}}>
                    <Text>Join Game</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button}>
                    <Text>How to play</Text>
                </TouchableOpacity>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#EEE',
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    buttonContainer: {
        marginTop: 20,
    },
    button: {
        backgroundColor: '#DDD',
        padding: 10,
        margin: 10,
    }
});