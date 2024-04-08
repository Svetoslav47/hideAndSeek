import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import Checkbox from 'expo-checkbox';

import { StackNavigationProp } from "@react-navigation/stack";
import { NavStackParamList } from "../components/Navigation";
import { RouteProp } from '@react-navigation/native';

import { useEffect, useState } from "react";
import { useIsFocused } from '@react-navigation/native';

import Button from "../components/Button";


type StartGameProps = {
    navigation: StackNavigationProp<NavStackParamList, "StartGame">
    route: RouteProp<NavStackParamList, 'StartGame'>;
}

export default function StartGame({ navigation, route }: StartGameProps) {
    const [gameName, setGameName] = useState("");
    const [isGamePrivate, setIsGamePrivate] = useState(false);
    const [password, setPassword] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [longitude, setLongitude] = useState(route.params?.longitude || "");
    const [latitude, setLatidude] = useState(route.params?.latitude || "");
    const [circleRadius, setCircleRadius] = useState(route.params?.circleRadius || "");

    const isFocused = useIsFocused();

    useEffect(() => {
        setLongitude(route.params?.longitude || "");
        setLatidude(route.params?.latitude || "");
        setCircleRadius(route.params?.circleRadius || "");
    }, [isFocused]);

    function submitForm() {
        console.log("submitting form");
        if (gameName === "") return;
        console.log("passed gameName");
        if (playerName === "") return;
        console.log("passed playerName");
        if (isGamePrivate && password === "") return;
        console.log("passed password");
        if (longitude === "") return;
        console.log("passed longitude");
        if (latitude === "") return;
        console.log("passed latitude");
        if (circleRadius === "") return;
        console.log("passed circleRadius and submitting form");
        fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/createGame`, {
            method: "POST",
            body: JSON.stringify({
                gameName,
                isGamePrivate,
                password,
                playerName,
                longitude,
                latitude,
                circleRadius
            }),
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log(data);
            })
            .catch(err => {
                console.error(err);
            });
            
    }
    return (
        <View style={styles.container}>
            <Text style={styles.header}>StartGame</Text>
            <View style={styles.inputsContainer}>
                <View style={styles.inputField}>
                    <Text style={styles.inputText}>Game Name</Text>
                    <TextInput style={styles.inputTextInput} value={gameName} onChange={(e) => setGameName(e.nativeEvent.text)} placeholder="Enter Game Name" />
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

                <View style={styles.inputField}>
                    <Text style={styles.inputText}>Long.</Text>
                    <TextInput keyboardType="number-pad" style={styles.inputTextInput} value={longitude} onChange={(e) => setLongitude(e.nativeEvent.text)} placeholder="Enter Longitude" />

                    <Text style={StyleSheet.compose(styles.inputText, {paddingLeft:10})}>Lat.</Text>
                    <TextInput keyboardType="number-pad" style={styles.inputTextInput} value={latitude} onChange={(e) => setLatidude(e.nativeEvent.text)} placeholder="Enter Longitude" />

                    <Button icon="crosshairs-gps" onPress={() => { navigation.navigate("PickFromMap") }} size={20} color="black" />
                </View>
                <View style={styles.inputField}>
                    <Text style={styles.inputText}>Circle Radius</Text>
                    <TextInput keyboardType="number-pad" style={styles.inputTextInput} value={circleRadius} onChange={(e) => setCircleRadius(e.nativeEvent.text)} placeholder="Enter Circle Radius" />

                    <Button icon="crosshairs-gps" onPress={() => { navigation.navigate("PickFromMap") }} size={20} color="black" />
                </View>
                <TouchableOpacity style={StyleSheet.compose(styles.button, { margin: 0 })} onPress={() => { submitForm() }}>
                    <Text>Start Game</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.footer}>
                <TouchableOpacity style={styles.button} onPress={() => { navigation.goBack() }}>
                    <Text>Back</Text>
                </TouchableOpacity >
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