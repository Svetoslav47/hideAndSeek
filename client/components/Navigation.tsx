import React from "react";

import { createStackNavigator } from "@react-navigation/stack";

import StartScreen from "../pages/StartScreen";
import StartGame from "../pages/StartGame";
import PickFromMap from "../pages/PickFromMap";

export type NavStackParamList = {
    StartScreen: undefined;
	StartGame: undefined;
	PickFromMap: undefined;
};

const NavStack = createStackNavigator<NavStackParamList>();

export default function NavStackContainer() {
	return (
		<NavStack.Navigator>
			<NavStack.Screen name="StartScreen" component={StartScreen} options={{ headerShown: false }} />
			<NavStack.Screen name="StartGame" component={StartGame} options={{ headerShown: false }} />
			<NavStack.Screen name="PickFromMap" component={PickFromMap} options={{ headerShown: false }} />
		</NavStack.Navigator>
	);
}