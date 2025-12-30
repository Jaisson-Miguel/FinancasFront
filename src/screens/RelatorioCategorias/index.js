import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import Header from "./../../components/Header";
import API_URL from "./../../config";
export default function RelatorioCategorias({ route, navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [listaGastos, setListaGastos] = useState([]);
  const [listaEmprestimos, setListaEmprestimos] = useState([]);
  const [listaInicio, setListaInicio] = useState([]);
  const [listaEntradas, setListaEntradas] = useState([]);
  const [totalGastos, setTotalGastos] = useState(0);
  const [totalEmprestimos, setTotalEmprestimos] = useState(0);
  const [totalInicio, setTotalInicio] = useState(0);
  const [totalEntradas, setTotalEntradas] = useState(0);
  useEffect(() => {
    carregarDados();
  }, []);
  const carregarDados = async () => {
    try {
      if (!refreshing) setLoading(true);
      const response = await fetch(
        `${API_URL}/extrato/categorias?t=${Date.now()}`
      );
      const { categorias, totalEntrada } = await response.json();

      if (Array.isArray(categorias)) {
        const apenasEmprestimos = categorias.filter(
          (item) => item._id === "Empréstimos"
        );
        const apenasInicio = categorias.filter((item) => item._id === "Inicio");
        const apenasEntradas = categorias.filter(
          (item) => item._id === "entrada"
        );
        const apenasGastos = categorias.filter(
          (item) =>
            item._id !== "Empréstimos" &&
            item._id !== "Inicio" &&
            item._id !== "entrada"
        );

        // GASTOS
        const totalG = apenasGastos.reduce(
          (acc, item) => acc + Math.abs(item.total),
          0
        );
        setTotalGastos(totalG);
        setListaGastos(
          apenasGastos.map((item) => ({
            nome: item._id || "Outros",
            valor: item.total,
            valorAbsoluto: Math.abs(item.total),
          }))
        );

        // EMPRÉSTIMOS
        const totalE = apenasEmprestimos.reduce(
          (acc, item) => acc + item.total,
          0
        );
        setTotalEmprestimos(totalE);
        setListaEmprestimos(
          apenasEmprestimos.map((item) => ({
            nome: item._id,
            valor: item.total,
            valorAbsoluto: Math.abs(item.total),
          }))
        );

        // INÍCIO
        const totalI = apenasInicio.reduce((acc, item) => acc + item.total, 0);
        setTotalInicio(totalI);
        setListaInicio(
          apenasInicio.map((item) => ({
            nome: item._id,
            valor: item.total,
            valorAbsoluto: Math.abs(item.total),
          }))
        );

        // ENTRADAS
        setListaEntradas([
          {
            nome: "Entradas Diretas",
            valor: totalEntrada,
            valorAbsoluto: Math.abs(totalEntrada),
          },
        ]);
        setTotalEntradas(totalEntrada || 0);
      } else {
        setListaGastos([]);
        setListaEmprestimos([]);
        setListaInicio([]);
        setListaEntradas([]);
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
  const renderCategoriaItem = (item, totalReferencia, corBarra) => {
    const porcentagem =
      totalReferencia === 0
        ? 0
        : (item.valorAbsoluto / Math.abs(totalReferencia)) * 100;
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
          color="#0984e3"
          style={{ marginTop: 40 }}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* ENTRADAS DIRETAS */}
          {totalEntradas > 0 && (
            <>
              <View style={[styles.sectionHeader, styles.sectionEntrada]}>
                <Text style={[styles.sectionTitle, { color: "#00b894" }]}>
                  Entradas Diretas
                </Text>
                <Text style={[styles.sectionTotal, { color: "#00b894" }]}>
                  R$ {Math.abs(totalEntradas).toFixed(2).replace(".", ",")}
                </Text>
              </View>
              {listaEntradas.map((item) =>
                renderCategoriaItem(item, totalEntradas, "#00b894")
              )}
            </>
          )}

          {/* GASTOS */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Gastos Operacionais</Text>
            <Text style={styles.sectionTotal}>
              R$ {totalGastos.toFixed(2).replace(".", ",")}
            </Text>
          </View>
          {listaGastos.length === 0 &&
          listaEmprestimos.length === 0 &&
          listaInicio.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum dado encontrado.</Text>
          ) : (
            listaGastos.map((item) =>
              renderCategoriaItem(item, totalGastos, "#2d3436")
            )
          )}
          {/* INÍCIO */}
          {listaInicio.length > 0 && (
            <>
              <View style={[styles.sectionHeader, styles.sectionInicio]}>
                <Text style={[styles.sectionTitle, { color: "#6c5ce7" }]}>
                  Saldos Iniciais
                </Text>
                <Text style={[styles.sectionTotal, { color: "#6c5ce7" }]}>
                  R$ {Math.abs(totalInicio).toFixed(2).replace(".", ",")}
                </Text>
              </View>
              {listaInicio.map((item) =>
                renderCategoriaItem(item, totalInicio, "#6c5ce7")
              )}
            </>
          )}
          {/* EMPRÉSTIMOS */}
          {listaEmprestimos.length > 0 && (
            <>
              <View style={[styles.sectionHeader, styles.sectionEmprestimo]}>
                <Text style={[styles.sectionTitle, { color: "#0984e3" }]}>
                  Empréstimos / Caixas
                </Text>
                <Text
                  style={[
                    styles.sectionTotal,
                    { color: totalEmprestimos >= 0 ? "#00b894" : "#d63031" },
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
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
    paddingHorizontal: 5,
  },
  sectionEmprestimo: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: "#dfe6e9",
    paddingTop: 20,
  },
  sectionInicio: {
    marginTop: 30,
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
  sectionEntrada: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: "#dfe6e9",
    paddingTop: 20,
  },
});
