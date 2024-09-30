import { View, Text, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import Checkbox from 'expo-checkbox';

import { StackNavigationProp } from "@react-navigation/stack";
import { NavStackParamList } from "../components/Navigation";
import { RouteProp } from '@react-navigation/native';

import { useEffect, useState } from "react";
import { useIsFocused } from '@react-navigation/native';

import Button from "../components/Button";


type CreateGameProps = {
    navigation: StackNavigationProp<NavStackParamList, "CreateGame">
    route: RouteProp<NavStackParamList, 'CreateGame'>;
}

export default function CreateGame({ navigation, route }: CreateGameProps) {
    const [gameName, setGameName] = useState("");
    const [isGamePrivate, setIsGamePrivate] = useState(false);
    const [password, setPassword] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [longitude, setLongitude] = useState(route.params?.longitude || "");
    const [latitude, setLatidude] = useState(route.params?.latitude || "");
    const [circleRadius, setCircleRadius] = useState(route.params?.circleRadius || "");

    const [gameLengthHours, setGameLengthHours] = useState("");
    const [gameLengthMinutes, setGameLengthMinutes] = useState("");
    const [gameLengthSeconds, setGameLengthSeconds] = useState("");

    const [timeUntilStartHours, setTimeUntilStartHours] = useState("");
    const [timeUntilStartMinutes, setTimeUntilStartMinutes] = useState("");
    const [timeUntilStartSeconds, setTimeUntilStartSeconds] = useState("");

    const isFocused = useIsFocused();

    useEffect(() => {
        setLongitude(route.params?.longitude || "");
        setLatidude(route.params?.latitude || "");
        setCircleRadius(route.params?.circleRadius || "");
    }, [isFocused]);

    function submitForm() {
        if (!gameName ||
            !playerName || 
            !longitude || 
            !latitude || 
            !circleRadius || 
            !gameLengthHours || 
            !gameLengthMinutes || 
            !gameLengthSeconds || 
            !timeUntilStartHours || 
            !timeUntilStartMinutes || 
            !timeUntilStartSeconds
        ) {
            console.error("Missing fields");
            return;
        }

        if (isGamePrivate && !password) {
            console.error("Missing password");
            return;
        }
        const gameLengthHoursInt = parseInt(gameLengthHours);
        const gameLengthMinutesInt = parseInt(gameLengthMinutes);
        const gameLengthSecondsInt = parseInt(gameLengthSeconds);

        const timeUntilStartHoursInt = parseInt(timeUntilStartHours);
        const timeUntilStartMinutesInt = parseInt(timeUntilStartMinutes);
        const timeUntilStartSecondsInt = parseInt(timeUntilStartSeconds);

        const timeUntilStartTotalSeconds = timeUntilStartHoursInt * 3600 + timeUntilStartMinutesInt * 60 + timeUntilStartSecondsInt;

        const gameLengthTotalSeconds = gameLengthHoursInt * 3600 + gameLengthMinutesInt * 60 + gameLengthSecondsInt;

        fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/createGame`, {
            method: "POST",
            body: JSON.stringify({
                gameName,
                isGamePrivate,
                password,
                playerName,
                longitude,
                latitude,
                circleRadius,
                gameLength: gameLengthTotalSeconds,
                timeUntilStart: timeUntilStartTotalSeconds
            }),
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then(res => res.json())
            .then(data => {
                console.log(data);
                const { gameID, error } = data;
                if (error) {
                    console.error(error);
                    return;
                }
                navigation.navigate("Game", { gameID, playerName, password });
            })
            .catch(err => {
                console.error(err);
            });
            
    }
    return (
        <View style={styles.container}>
            <Text style={styles.header}>Create Game</Text>
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
                
                {/* game length in hours min and sec */}
                <View style={styles.inputField}>
                    <Text style={styles.inputText}>Game Length</Text>
                    <TextInput keyboardType="number-pad" style={styles.inputTextInput} value={gameLengthHours} placeholder="Hours" onChange={(e) => setGameLengthHours(e.nativeEvent.text)} />
                    <Text style={styles.inputText}>h:</Text>
                    <TextInput keyboardType="number-pad" style={styles.inputTextInput} value={gameLengthMinutes} placeholder="Minutes" onChange={(e) => {if (parseInt(e.nativeEvent.text) > 59) setGameLengthMinutes("59"); else setGameLengthMinutes(e.nativeEvent.text)} } />
                    <Text style={styles.inputText}>m:</Text>
                    <TextInput keyboardType="number-pad" style={styles.inputTextInput} value={gameLengthSeconds} placeholder="Seconds" onChange={(e) => {if (parseInt(e.nativeEvent.text) > 59) setGameLengthSeconds("59"); else setGameLengthSeconds(e.nativeEvent.text)} } />
                    <Text style={styles.inputText}>s</Text>
                </View>

                {/* time until start in hours min and sec */}
                <View style={styles.inputField}>
                    <Text style={styles.inputText}>Time Until Start</Text>
                    <TextInput keyboardType="number-pad" style={styles.inputTextInput} value={timeUntilStartHours} placeholder="Hours" onChange={(e) => setTimeUntilStartHours(e.nativeEvent.text)} />
                    <Text style={styles.inputText}>h:</Text>
                    <TextInput keyboardType="number-pad" style={styles.inputTextInput} value={timeUntilStartMinutes} placeholder="Minutes" onChange={(e) => {if (parseInt(e.nativeEvent.text) > 59) setTimeUntilStartMinutes("59"); else setTimeUntilStartMinutes(e.nativeEvent.text)} } />
                    <Text style={styles.inputText}>m:</Text>
                    <TextInput keyboardType="number-pad" style={styles.inputTextInput} value={timeUntilStartSeconds} placeholder="Seconds" onChange={(e) => {if (parseInt(e.nativeEvent.text) > 59) setTimeUntilStartSeconds("59"); else setTimeUntilStartSeconds(e.nativeEvent.text)} } />
                    <Text style={styles.inputText}>s</Text>
                </View>

                <TouchableOpacity style={StyleSheet.compose(styles.button, { margin: 0 })} onPress={() => { submitForm() }}>
                    <Text>Create Game</Text>
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