import React from "react";

import { createStackNavigator } from "@react-navigation/stack";

import StartScreen from "../pages/StartScreen";
import StartGame from "../pages/StartGame";
import PickFromMap from "../pages/PickFromMap";
import Game from "../pages/Game";
import JoinGame from "../pages/JoinGame";

export type NavStackParamList = {
    StartScreen: undefined;
	StartGame: {
		longitude?: string | null;
		latitude?: string | null;
		circleRadius?: string | null;
	} | undefined;
	PickFromMap: undefined;
	Game: {
		gameID: string;
		playerName: string;
		password: string;
	};
	JoinGame: undefined;
};

const NavStack = createStackNavigator<NavStackParamList>();

export default function NavStackContainer() {
	return (
		<NavStack.Navigator>
			<NavStack.Screen name="StartScreen" component={StartScreen} options={{ headerShown: false }} />
			<NavStack.Screen name="StartGame" component={StartGame} options={{ headerShown: false }} />
			<NavStack.Screen name="PickFromMap" component={PickFromMap} options={{ headerShown: false }} />
			<NavStack.Screen name="Game" component={Game} options={{ headerShown: false }} />
			<NavStack.Screen name="JoinGame" component={JoinGame} options={{ headerShown: false }} />
		</NavStack.Navigator>
	);
}