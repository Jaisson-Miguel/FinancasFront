import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";

export default function HomeScreen({ navigation }) {
  const [principalId, setPrincipalId] = useState(null);
  const [temPendencias, setTemPendencias] = useState(false);
  const netInfo = useNetInfo();
  const isOffline = netInfo.isConnected === false;

  const buscarDados = async () => {
    try {
      // 1. Busca ID do Principal
      const idSalvo = await AsyncStorage.getItem("@caixa_principal_id");
      if (idSalvo) {
        setPrincipalId(idSalvo);
      }

      // 2. Verifica se tem pendências offline
      const jsonPendencias = await AsyncStorage.getItem(
        "@financas:movimentacoes_offline"
      );
      const lista = jsonPendencias ? JSON.parse(jsonPendencias) : [];
      setTemPendencias(lista.length > 0);
    } catch (error) {
      console.log("Erro ao ler Storage:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      buscarDados();
    });
    return unsubscribe;
  }, [navigation]);

  const handleNavegarMovimentacao = () => {
    if (principalId) {
      navigation.navigate("NovaMovimentacao", {
        caixaId: principalId,
        caixaNome: "Caixa Principal",
      });
    } else {
      Alert.alert("Atenção", "Sincronize as caixas primeiro.");
    }
  };

  // Nova função para ir direto ao Extrato do Principal
  const handleNavegarPrincipal = () => {
    if (principalId) {
      navigation.navigate("PainelPrincipal", {
        caixaId: principalId,
        caixaNome: "Principal",
      });
    } else {
      Alert.alert("Atenção", "Caixa Principal não identificado.");
    }
  };

  return (
    <View style={[styles.container, isOffline && styles.containerOffline]}>
      <Text style={[styles.headerTitle, isOffline && styles.textOffline]}>
        {isOffline ? "MODO OFFLINE" : "Controle Financeiro"}
      </Text>

      <View style={styles.buttonsArea}>
        {/* --- MODO OFFLINE --- */}
        {isOffline ? (
          <>
            <TouchableOpacity
              style={[styles.moneyButton, { backgroundColor: "#636e72" }]}
              onPress={() => {
                navigation.navigate("MovimentacaoOffline", {
                  caixaNome: "OFFLINE",
                });
              }}
            >
              <FontAwesome name="save" size={32} color="#fff" />
              <Text style={styles.btnText}>Nova Movimentação (Offline)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.moneyButton, { backgroundColor: "#0984e3" }]}
              onPress={() => navigation.navigate("ListaOffline")}
            >
              <FontAwesome name="list-ul" size={32} color="#fff" />
              <Text style={styles.btnText}>Ver Pendentes</Text>
            </TouchableOpacity>
          </>
        ) : (
          /* --- MODO ONLINE --- */
          <>
            {/* BOTÃO DE PENDÊNCIAS */}
            {temPendencias && (
              <TouchableOpacity
                style={[
                  styles.moneyButton,
                  { backgroundColor: "#0984e3", marginBottom: 10 },
                ]}
                onPress={() => navigation.navigate("ListaOffline")}
              >
                <FontAwesome name="cloud-upload" size={32} color="#fff" />
                <Text style={styles.btnText}>Sincronizar Pendentes</Text>
              </TouchableOpacity>
            )}

            {/* 1. CAIXA PRINCIPAL (NOVO BOTÃO DESTAQUE) */}
            <TouchableOpacity
              style={[
                styles.moneyButton,
                { backgroundColor: "#2d3436", marginBottom: 10 }, // Cor escura para destaque
                !principalId && { opacity: 0.6 },
              ]}
              onPress={handleNavegarPrincipal}
            >
              <FontAwesome name="bank" size={32} color="#fff" />
              <Text style={styles.btnText}>Caixa Principal</Text>
            </TouchableOpacity>

            {/* 2. CAIXAS SECUNDÁRIOS */}
            <TouchableOpacity
              style={[styles.moneyButton, { backgroundColor: "#27ae60" }]}
              onPress={() => navigation.navigate("Caixas")}
            >
              <FontAwesome name="dollar" size={32} color="#fff" />
              <Text style={styles.btnText}>Caixas Secundários</Text>
            </TouchableOpacity>

            {/* 3. REGISTRAR MOVIMENTAÇÃO */}
            <TouchableOpacity
              style={[
                styles.moneyButton,
                { backgroundColor: "#c0392b" },
                !principalId && { opacity: 0.6 },
              ]}
              onPress={handleNavegarMovimentacao}
            >
              <FontAwesome name="money" size={32} color="#fff" />
              <Text style={styles.btnText}>Registrar Movimentação</Text>
            </TouchableOpacity>

            {/* 4. CONTAS A PAGAR */}
            <TouchableOpacity
              style={[styles.moneyButton, { backgroundColor: "#e67e22" }]}
              onPress={() => navigation.navigate("ContasAPagar")}
            >
              <FontAwesome name="calendar" size={32} color="#fff" />
              <Text style={styles.btnText}>Contas a Pagar</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {isOffline && (
        <Text style={styles.offlineWarning}>
          Sem conexão. As funções normais foram bloqueadas.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f2f6",
    justifyContent: "center",
    padding: 20,
  },
  containerOffline: {
    backgroundColor: "#2d3436",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2d3436",
    textAlign: "center",
    marginBottom: 30,
  },
  textOffline: {
    color: "#fff",
  },
  buttonsArea: {
    gap: 15, // Reduzi um pouco o gap para caber tudo
  },
  moneyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20, // Ajustei altura para ficar harmônico
    borderRadius: 12,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  btnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 15,
  },
  offlineWarning: {
    textAlign: "center",
    color: "#b2bec3",
    marginTop: 30,
    fontStyle: "italic",
  },
});
