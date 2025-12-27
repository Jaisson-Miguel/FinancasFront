import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import Header from "./../../components/Header";
import API_URL from "./../../config";

export default function RelatorioCategorias({ route, navigation }) {
  // Mantemos o parâmetro apenas para compatibilidade visual do título
  const { caixaNome } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados separados para as listas e totais
  const [listaGastos, setListaGastos] = useState([]);
  const [listaEmprestimos, setListaEmprestimos] = useState([]);
  const [totalGastos, setTotalGastos] = useState(0);
  const [totalEmprestimos, setTotalEmprestimos] = useState(0);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      if (!refreshing) setLoading(true);

      // Busca o relatório geral do backend
      // O backend agora retorna TUDO que é gasto (negativo) OU categoria "Empréstimo"
      const response = await fetch(
        `${API_URL}/extrato/categorias?t=${new Date().getTime()}`
      );
      const data = await response.json();

      if (Array.isArray(data)) {
        // 1. Separa o que é Empréstimo do resto
        const apenasEmprestimos = data.filter(
          (item) => item._id === "Empréstimos"
        );
        const apenasGastos = data.filter((item) => item._id !== "Empréstimos");

        // 2. Calcula Totais e Formata GASTOS
        // Para gastos, o valor vem negativo, convertemos para positivo para exibir
        const totalG = apenasGastos.reduce(
          (acc, item) => acc + Math.abs(item.total),
          0
        );
        setTotalGastos(totalG);

        const gastosFormatados = apenasGastos.map((item) => ({
          nome: item._id || "Outros",
          valor: item.total, // Mantém o valor original (negativo)
          valorAbsoluto: Math.abs(item.total),
        }));
        setListaGastos(gastosFormatados);

        // 3. Calcula Totais e Formata EMPRÉSTIMOS
        // Empréstimos podem ser positivos (recebeu) ou negativos (enviou)
        // Aqui somamos o valor líquido
        const totalE = apenasEmprestimos.reduce(
          (acc, item) => acc + item.total,
          0
        );
        setTotalEmprestimos(totalE);

        const emprestimosFormatados = apenasEmprestimos.map((item) => ({
          nome: item._id, // Será "Empréstimo"
          valor: item.total,
          valorAbsoluto: Math.abs(item.total),
        }));
        setListaEmprestimos(emprestimosFormatados);
      } else {
        setListaGastos([]);
        setListaEmprestimos([]);
      }
    } catch (error) {
      console.error("Erro ao carregar relatório:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregarDados();
  }, []);

  // Função auxiliar para renderizar cada item da lista
  const renderCategoriaItem = (item, totalReferencia, corBarra) => {
    // Evita divisão por zero
    const porcentagem =
      totalReferencia === 0
        ? 0
        : (item.valorAbsoluto / Math.abs(totalReferencia)) * 100;

    // Se for valor positivo (entrada/pagamento de empréstimo), fica verde. Se negativo, vermelho.
    const corValor = item.valor >= 0 ? "#00b894" : "#d63031";

    return (
      <View key={item.nome} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.rowNome}>
            <View style={styles.iconBg}>
              <FontAwesome name="tag" size={16} color="#636e72" />
            </View>
            <Text style={styles.catNome}>{item.nome}</Text>
          </View>
          <Text style={[styles.catValor, { color: corValor }]}>
            R$ {Math.abs(item.valor).toFixed(2).replace(".", ",")}
          </Text>
        </View>

        {/* Barra de Progresso */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressFill,
              { width: `${porcentagem}%`, backgroundColor: corBarra },
            ]}
          />
        </View>
        <Text style={styles.porcentagemText}>
          {porcentagem.toFixed(1)}% do total
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title="Relatório Financeiro"
        showBack={true}
        navigation={navigation}
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2d3436"
          style={{ marginTop: 50 }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* --- BLOCO 1: GASTOS OPERACIONAIS --- */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gastos Operacionais</Text>
            <Text style={styles.sectionTotal}>
              R$ {totalGastos.toFixed(2).replace(".", ",")}
            </Text>
          </View>

          {listaGastos.length === 0 && listaEmprestimos.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum dado encontrado.</Text>
          ) : (
            listaGastos.map((item) =>
              renderCategoriaItem(item, totalGastos, "#2d3436")
            )
          )}

          {/* --- BLOCO 2: EMPRÉSTIMOS --- */}
          {listaEmprestimos.length > 0 && (
            <>
              <View style={[styles.sectionHeader, styles.sectionEmprestimo]}>
                <Text style={[styles.sectionTitle, { color: "#0984e3" }]}>
                  Empréstimos / Caixas
                </Text>
                <Text
                  style={[
                    styles.sectionTotal,
                    {
                      color: totalEmprestimos >= 0 ? "#00b894" : "#d63031",
                    },
                  ]}
                >
                  R$ {Math.abs(totalEmprestimos).toFixed(2).replace(".", ",")}
                </Text>
              </View>

              {listaEmprestimos.map((item) =>
                renderCategoriaItem(
                  item,
                  totalEmprestimos,
                  item.valor >= 0 ? "#00b894" : "#d63031"
                )
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f2f6",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // Cabeçalhos de Seção
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
    paddingHorizontal: 5,
  },
  sectionEmprestimo: {
    marginTop: 30, // Mais espaço antes dos empréstimos
    borderTopWidth: 1,
    borderTopColor: "#dfe6e9",
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#636e72",
    textTransform: "uppercase",
  },
  sectionTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3436",
  },
  // Cards
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  rowNome: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBg: {
    backgroundColor: "#f1f2f6",
    padding: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  catNome: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3436",
  },
  catValor: {
    fontSize: 16,
    fontWeight: "bold",
  },
  progressContainer: {
    height: 6,
    backgroundColor: "#f1f2f6",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 5,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  porcentagemText: {
    fontSize: 12,
    color: "#b2bec3",
    textAlign: "right",
  },
  emptyText: {
    textAlign: "center",
    color: "#b2bec3",
    marginTop: 30,
    marginBottom: 20,
    fontStyle: "italic",
  },
});
