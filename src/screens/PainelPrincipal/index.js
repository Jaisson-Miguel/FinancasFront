import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Header from "./../../components/Header";
import API_URL from "./../../config";

export default function PainelPrincipal({ route, navigation }) {
  const { caixaId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para os indicadores
  const [saldoTotal, setSaldoTotal] = useState(0);
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);

  const carregarDados = async () => {
    if (!caixaId) return;

    try {
      if (!refreshing) setLoading(true);
      const timestamp = new Date().getTime();

      // 1. Busca os dados da Caixa (para pegar o SALDO OFICIAL da caixa atual)
      const responseCaixa = await fetch(
        `${API_URL}/caixas/${caixaId}?t=${timestamp}`
      );
      const dataCaixa = await responseCaixa.json();

      // 2. Busca o Resumo (Entradas e Saídas calculadas no Backend)
      // Agora chamamos a rota real que separa positivos e negativos
      const responseResumo = await fetch(
        `${API_URL}/extrato/resumo?t=${timestamp}`
      );
      const dataResumo = await responseResumo.json();

      // Atualiza os estados
      setSaldoTotal(dataCaixa.saldo || 0);
      setTotalEntradas(dataResumo.totalEntradas || 0);
      setTotalSaidas(dataResumo.totalSaidas || 0);
    } catch (error) {
      console.log("Erro ao carregar painel:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [caixaId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    carregarDados();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f1f2f6" }}>
      <Header
        title="Painel Principal"
        showBack={true}
        navigation={navigation}
      />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <ActivityIndicator size="large" color="#2d3436" />
        ) : (
          <>
            {/* Card de Saldo Total (Vindo do Banco de Dados) */}
            <View style={styles.cardSaldo}>
              <Text style={styles.labelSaldo}>SALDO ATUAL (CAIXA)</Text>
              <Text
                style={[
                  styles.valorSaldo,
                  saldoTotal < 0 && styles.valorNegativo,
                ]}
              >
                R${" "}
                {saldoTotal ? saldoTotal.toFixed(2).replace(".", ",") : "0,00"}
              </Text>
            </View>

            {/* Resumo de Entradas e Saídas (Genérico por enquanto) */}
            <View style={styles.rowResumo}>
              {/* Entradas */}
              <View style={styles.cardResumo}>
                <View style={styles.iconBgEntrada}>
                  <FontAwesome name="arrow-up" size={20} color="#00b894" />
                </View>
                <View>
                  <Text style={styles.labelResumo}>Entradas</Text>
                  <Text style={[styles.valorResumo, { color: "#00b894" }]}>
                    R$ {totalEntradas.toFixed(2).replace(".", ",")}
                  </Text>
                </View>
              </View>

              {/* Saídas */}
              <View style={styles.cardResumo}>
                <View style={styles.iconBgSaida}>
                  <FontAwesome name="arrow-down" size={20} color="#d63031" />
                </View>
                <View>
                  <Text style={styles.labelResumo}>Saídas</Text>
                  <Text style={[styles.valorResumo, { color: "#d63031" }]}>
                    R$ {Math.abs(totalSaidas).toFixed(2).replace(".", ",")}
                  </Text>
                </View>
              </View>
            </View>

            {/* Ações / Botões */}
            <View style={styles.actionsContainer}>
              {/* Botão 1: Extrato Geral (Todos os Caixas) */}
              <TouchableOpacity
                style={styles.btnAction}
                onPress={() =>
                  navigation.navigate("Extrato", {
                    caixaNome: "Geral",
                    // Não passamos ID aqui para cair na lógica do "Principal"
                  })
                }
              >
                <FontAwesome name="list-alt" size={24} color="#fff" />
                <Text style={styles.btnActionText}>Extrato Geral (Todos)</Text>
              </TouchableOpacity>

              {/* Botão 2: Extrato Principal (Apenas Principal) */}
              <TouchableOpacity
                style={[styles.btnAction, { marginTop: 10 }]}
                onPress={() =>
                  navigation.navigate("Extrato", {
                    caixaId,
                    caixaNome: "Principal", // Força o nome Principal
                  })
                }
              >
                <FontAwesome name="star" size={24} color="#ffeaa7" />
                <Text style={[styles.btnActionText, { color: "#ffeaa7" }]}>
                  Extrato Principal
                </Text>
              </TouchableOpacity>

              {/* Botão Ver por Categorias */}
              <TouchableOpacity
                style={[
                  styles.btnAction,
                  { marginTop: 10, backgroundColor: "#636e72" },
                ]}
                onPress={() =>
                  navigation.navigate("RelatorioCategorias", {
                    caixaId,
                    caixaNome: "Principal",
                  })
                }
              >
                <FontAwesome name="pie-chart" size={24} color="#fff" />
                <Text style={styles.btnActionText}>Ver por Categorias</Text>
              </TouchableOpacity>
              {/* Contador */}
              <TouchableOpacity
                style={[
                  styles.btnAction,
                  { backgroundColor: "#5943ecff", marginTop: 10 },
                ]}
                onPress={() =>
                  navigation.navigate("Contador", { saldo: saldoTotal })
                }
              >
                <FontAwesome name="money" size={24} color="#fff" />
                <Text style={styles.btnActionText}>Contador</Text>
              </TouchableOpacity>

              {/* Botão Novo Lançamento */}
              <TouchableOpacity
                style={[
                  styles.btnAction,
                  { backgroundColor: "#00b894", marginTop: 10 },
                ]}
                onPress={() =>
                  navigation.navigate("NovaMovimentacao", {
                    caixaId,
                    caixaNome: "Principal",
                  })
                }
              >
                <FontAwesome name="plus" size={24} color="#fff" />
                <Text style={styles.btnActionText}>Novo Lançamento</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btnAction,
                  { backgroundColor: "#a600b8ff", marginTop: 10 },
                ]}
                onPress={() => navigation.navigate("RelatorioPdf")}
              >
                <FontAwesome name="plus" size={24} color="#fff" />
                <Text style={styles.btnActionText}>Novo Lançamento</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  cardSaldo: {
    backgroundColor: "#2d3436",
    padding: 25,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 25,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  labelSaldo: {
    color: "#b2bec3",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 5,
  },
  valorSaldo: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
  },
  valorNegativo: {
    color: "#ff7675",
  },
  rowResumo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
    gap: 15,
  },
  cardResumo: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 2,
  },
  iconBgEntrada: {
    backgroundColor: "rgba(0, 184, 148, 0.1)",
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  iconBgSaida: {
    backgroundColor: "rgba(214, 48, 49, 0.1)",
    padding: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  labelResumo: {
    fontSize: 12,
    color: "#636e72",
    fontWeight: "600",
  },
  valorResumo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3436",
  },
  actionsContainer: {
    gap: 10,
  },
  btnAction: {
    backgroundColor: "#2d3436",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    borderRadius: 12,
    elevation: 3,
  },
  btnActionText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 10,
  },
});
