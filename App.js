import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Importe sua tela aqui (ajuste o caminho conforme onde você salvou)
import HomeScreen from "./src/screens/HomeScreen";
import Caixas from "./src/screens/Caixas";
import CriarCaixa from "./src/screens/CriarCaixa";
import Extrato from "./src/screens/Extrato";
import NovaMovimentacao from "./src/screens/NovaMovimentacao";
import MovimentacaoOffline from "./src/screens/MovimentacaoOffline";
import ListaOffline from "./src/screens/ListaOffline";
import ContasAPagar from "./src/screens/ContasAPagar";
import CriarConta from "./src/screens/CriarConta";
import GerenciarContas from "./src/screens/GerenciarContas";
import TelaPagamento from "./src/screens/TelaPagamento";
import PainelPrincipal from "./src/screens/PainelPrincipal";
import RelatorioCategorias from "./src/screens/RelaorioCategorias";
import Contador from "./src/screens/Contador";
import RelatorioPdf from "./src/screens/RelatorioPdf";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="Caixas" component={Caixas} />
        <Stack.Screen name="CriarCaixa" component={CriarCaixa} />
        <Stack.Screen name="Extrato" component={Extrato} />
        <Stack.Screen name="NovaMovimentacao" component={NovaMovimentacao} />
        <Stack.Screen name="ContasAPagar" component={ContasAPagar} />
        <Stack.Screen name="CriarConta" component={CriarConta} />
        <Stack.Screen name="GerenciarContas" component={GerenciarContas} />
        <Stack.Screen name="TelaPagamento" component={TelaPagamento} />
        <Stack.Screen name="PainelPrincipal" component={PainelPrincipal} />
        <Stack.Screen name="Contador" component={Contador} />
        <Stack.Screen name="RelatorioPdf" component={RelatorioPdf} />
        <Stack.Screen
          name="RelatorioCategorias"
          component={RelatorioCategorias}
        />
        <Stack.Screen
          name="MovimentacaoOffline"
          component={MovimentacaoOffline}
        />
        <Stack.Screen name="ListaOffline" component={ListaOffline} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
