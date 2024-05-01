import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import Checkbox from 'expo-checkbox';

import { StackNavigationProp } from "@react-navigation/stack";
import { NavStackParamList } from "../components/Navigation";
import * as Location from 'expo-location';

type StartScreenProps = {
    navigation: StackNavigationProp<NavStackParamList, "JoinGame">
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

    const [gameID, setGameID] = useState("");
    const [isGamePrivate, setIsGamePrivate] = useState(false);
    const [password, setPassword] = useState("");
    const [playerName, setPlayerName] = useState("");

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Join Game</Text>
            <View style={styles.inputsContainer}>
                <View style={styles.inputField}>
                    <Text style={styles.inputText}>Game Id</Text>
                    <TextInput style={styles.inputTextInput} value={gameID} onChange={(e) => setGameID(e.nativeEvent.text)} placeholder="Enter Game Id" />
                </View>
                <View style={styles.smallInputField}>
                    <Text style={styles.inputText}>Private Game</Text>
                    <Checkbox style={styles.inputCheckBox} value={isGamePrivate} onValueChange={() => setIsGamePrivate(!isGamePrivate)} />
                </View>
                {isGamePrivate && <View style={styles.inputField}>
                    <Text style={styles.inputText}>Password</Text>
                    <TextInput style={styles.inputTextInput} secureTextEntry={true} value={password} onChange={(e) => setPassword(e.nativeEvent.text)} placeholder="Enter Password" />
                </View>}
                <View style={styles.inputField}>
                    <Text style={styles.inputText}>Player Name</Text>
                    <TextInput style={styles.inputTextInput} value={playerName} onChange={(e) => setPlayerName(e.nativeEvent.text)} placeholder="Enter Player Name" />
                </View>
                <TouchableOpacity style={StyleSheet.compose(styles.button, { margin: 0 })} onPress={() => { navigation.navigate("Game", {
                    gameID: gameID,
                    playerName: playerName,
                    password: password
                }) }}>
                    <Text>Start Game</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={() => { navigation.goBack() }}>
                    <Text>Back</Text>
                </TouchableOpacity >
            </View>
        </View>
    )
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
    inputsContainer: {
        marginTop: 20,
        width: "100%",
        paddingHorizontal: 40,
        alignItems: "flex-start",
    },
    inputField: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: '#DDD',
        marginVertical: 5,
        width: "100%",
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    smallInputField: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: 'transparent',
        marginTop: 0,
        maxWidth: "100%",
        width: "auto",
    },
    inputText: {
        paddingRight: 10,
        fontSize: 16,
    },
    inputTextInput: {
        flex: 1,
        padding: 5,
        borderWidth: 0.5,
        borderColor: "#000000F0",
    },
    inputCheckBox: {

    },
    button: {
        backgroundColor: '#DDD',
        padding: 10,
        margin: 10,
    },
    footer: {
        position: "absolute",
        bottom: 0,
        width: "100%",
        flexDirection: "row",
        justifyContent: "flex-start",
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderTopColor: "#AAA",
    }
});