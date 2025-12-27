import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "./../../components/Header";
import API_URL from "./../../config";

export default function Caixas({ navigation }) {
  const [caixaPrincipal, setCaixaPrincipal] = useState(null);
  const [caixasSecundarias, setCaixasSecundarias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Cores para as bordas laterais das caixas secundárias
  const cardColors = ["#0984e3", "#e17055", "#00b894", "#6c5ce7", "#fdcb6e"];

  const carregarCaixas = async () => {
    try {
      if (!refreshing) setLoading(true);
      const response = await fetch(`${API_URL}/caixas`);
      const data = await response.json();

      // 1. Encontra a Caixa Principal
      const principal = data.find((item) => item.nome === "Principal");

      // 2. Filtra as Secundárias (todas que não são Principal)
      const secundarias = data.filter((item) => item.nome !== "Principal");

      if (principal) {
        setCaixaPrincipal(principal);
        await AsyncStorage.setItem("@caixa_principal_id", principal._id);
      }

      setCaixasSecundarias(secundarias);
    } catch (error) {
      console.error("Erro ao buscar caixas:", error);
      Alert.alert("Erro", "Não foi possível carregar as caixas.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarCaixas();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    carregarCaixas();
  };

  const abrirCaixa = (caixa) => {
    const nomeParaEnviar = caixa.nome === "Principal" ? "Geral" : caixa.nome;
    navigation.navigate("Extrato", {
      caixaId: caixa._id,
      caixaNome: nomeParaEnviar,
    });
  };

  return (
    <View style={styles.container}>
      <Header title="Minhas Caixas" showBack={false} navigation={navigation} />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2d3436"
          style={{ marginTop: 50 }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* --- CAIXA PRINCIPAL (DESTAQUE) --- */}
          {caixaPrincipal && (
            <View style={{ marginBottom: 25 }}>
              <Text style={styles.sectionTitle}>Caixa Principal</Text>
              <TouchableOpacity
                style={styles.cardPrincipal}
                onPress={() => abrirCaixa(caixaPrincipal)}
                activeOpacity={0.9}
              >
                <View>
                  <Text style={styles.cardPrincipalTitle}>
                    Saldo Disponível
                  </Text>
                  <Text style={styles.cardPrincipalValue}>
                    R$ {caixaPrincipal.saldo.toFixed(2).replace(".", ",")}
                  </Text>
                  <Text style={styles.cardPrincipalSubtitle}>
                    Toque para ver extrato
                  </Text>
                </View>
                <FontAwesome name="chevron-right" size={20} color="#b2bec3" />
              </TouchableOpacity>
            </View>
          )}

          {/* --- CAIXAS SECUNDÁRIAS --- */}
          <Text style={styles.sectionTitle}>Outras Caixas</Text>

          {caixasSecundarias.length === 0 ? (
            <Text style={styles.emptyText}>
              Nenhuma caixa secundária encontrada.
            </Text>
          ) : (
            caixasSecundarias.map((item, index) => (
              <TouchableOpacity
                key={item._id}
                style={[
                  styles.card,
                  { borderLeftColor: cardColors[index % cardColors.length] },
                ]}
                onPress={() => abrirCaixa(item)}
              >
                <View>
                  <Text style={styles.boxName}>{item.nome}</Text>
                  <Text style={styles.boxBalance}>
                    R$ {item.saldo.toFixed(2).replace(".", ",")}
                  </Text>
                </View>
                <FontAwesome name="angle-right" size={24} color="#dfe6e9" />
              </TouchableOpacity>
            ))
          )}

          {/* --- BOTÃO CRIAR NOVA CAIXA --- */}
          <TouchableOpacity
            style={styles.btnCriar}
            onPress={() => navigation.navigate("CriarCaixa")}
          >
            <FontAwesome name="plus" size={18} color="#fff" />
            <Text style={styles.btnCriarText}>CRIAR NOVA CAIXA</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#b2bec3",
    marginBottom: 10,
    marginTop: 5,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  cardPrincipal: {
    backgroundColor: "#2d3436",
    padding: 25,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  cardPrincipalTitle: {
    color: "#b2bec3",
    fontSize: 14,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 5,
  },
  cardPrincipalValue: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "bold",
  },
  cardPrincipalSubtitle: {
    color: "#00b894",
    fontSize: 12,
    marginTop: 5,
    fontWeight: "bold",
  },
  emptyText: {
    textAlign: "center",
    color: "#b2bec3",
    marginBottom: 20,
    fontStyle: "italic",
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderLeftWidth: 5,
  },
  boxName: {
    fontSize: 16,
    color: "#636e72",
    marginBottom: 4,
    fontWeight: "600",
  },
  boxBalance: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3436",
  },
  btnCriar: {
    flexDirection: "row",
    backgroundColor: "#636e72",
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    marginBottom: 40,
    elevation: 2,
  },
  btnCriarText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 16,
    letterSpacing: 1,
  },
});
