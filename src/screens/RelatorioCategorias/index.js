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

  const [metasPorcentagemFixa, setMetasPorcentagemFixa] = useState({});

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      if (!refreshing) setLoading(true);
      const response = await fetch(
        `${API_URL}/extrato/categorias?t=${Date.now()}`
      );
      const data = await response.json();

      setListaGastos(data.gastos || []);
      setTotalGastos(data.totalGastos || 0);

      setListaEmprestimos(data.emprestimos || []);
      setTotalEmprestimos(data.totalEmprestimos || 0);

      setListaInicio(data.inicio || []);
      setTotalInicio(data.totalInicio || 0);

      setListaEntradas(data.entradas || []);
      setTotalEntradas(data.totalEntrada || 0);

      setMetasPorcentagemFixa(data.metasPorcentagemFixa || {});
    } catch (error) {
      console.error("Erro ao carregar relatório:", error);
      setListaGastos([]);
      setTotalGastos(0);
      setListaEmprestimos([]);
      setTotalEmprestimos(0);
      setListaInicio([]);
      setTotalInicio(0);
      setListaEntradas([]);
      setTotalEntradas(0);
      setMetasPorcentagemFixa({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    carregarDados();
  }, []);

  const renderCategoriaItem = (item, corBarraPadrao) => {
    // Renomeado para corBarraPadrao
    const metaPorcentagem = metasPorcentagemFixa[item.nome];

    // --- ALTERAÇÃO 1: Remover o sinal negativo dos valores ---
    const valorFormatado = Math.abs(item.valor).toFixed(2).replace(".", ",");
    const corValor = item.valor >= 0 ? "#00b894" : "#d63031"; // Mantém a cor vermelha para negativos
    // --------------------------------------------------------

    if (metaPorcentagem === undefined) {
      const porcentagem =
        totalEntradas === 0
          ? 0
          : (item.valorAbsoluto / Math.abs(totalEntradas)) * 100;

      // --- ALTERAÇÃO 2: Barra de progresso sempre verde se não houver meta ---
      const corBarraFinal = corBarraPadrao; // Usa a cor padrão passada (geralmente verde ou azul)
      // -----------------------------------------------------------------------

      return (
        <View key={item.nome} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.rowNome}>
              <View style={styles.iconBg}>
                <FontAwesome name="tag" size={18} color="#636e72" />
              </View>
              <Text style={styles.catNome}>{item.nome}</Text>
            </View>
            <Text style={[styles.catValor, { color: corValor }]}>
              R$ {valorFormatado}
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(porcentagem, 100)}%`,
                  backgroundColor: corBarraFinal,
                },
              ]}
            />
          </View>
          <Text style={styles.porcentagemText}>
            {porcentagem.toFixed(2).replace(".", ",")}% do total de entradas
          </Text>
        </View>
      );
    } else {
      const valorAlvo = (Math.abs(totalEntradas) * metaPorcentagem) / 100;
      const diferenca = valorAlvo - item.valorAbsoluto;

      let textoDiferenca;
      let corDiferenca;
      let porcentagemBarra;
      let corBarraFinal = corBarraPadrao; // Inicia com a cor padrão (verde)

      if (diferenca > 0) {
        textoDiferenca = `Faltam R$ ${diferenca
          .toFixed(2)
          .replace(".", ",")} (${metaPorcentagem
          .toFixed(2)
          .replace(".", ",")}%)`;
        corDiferenca = "#00b894"; // Verde
        porcentagemBarra = (item.valorAbsoluto / valorAlvo) * 100;
      } else {
        textoDiferenca = `Excedeu R$ ${Math.abs(diferenca)
          .toFixed(2)
          .replace(".", ",")} (${metaPorcentagem
          .toFixed(2)
          .replace(".", ",")}%)`;
        corDiferenca = "#d63031"; // Vermelho
        porcentagemBarra = 100; // Barra cheia, mas o texto indica que excedeu
        corBarraFinal = "#d63031"; // --- ALTERAÇÃO 2: Barra vermelha se exceder a meta ---
      }

      return (
        <View key={item.nome} style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.rowNome}>
              <View style={styles.iconBg}>
                <FontAwesome name="tag" size={18} color="#636e72" />
              </View>
              <Text style={styles.catNome}>{item.nome}</Text>
            </View>
            <Text style={[styles.catValor, { color: corValor }]}>
              R$ {valorFormatado}
            </Text>
          </View>
          <View style={styles.progressContainer}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(porcentagemBarra, 100)}%`,
                  backgroundColor: corBarraFinal,
                },
              ]}
            />
          </View>
          <Text style={[styles.porcentagemText, { color: corDiferenca }]}>
            {textoDiferenca}
          </Text>
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Relatório por Categorias" navigation={navigation} />
      {loading ? (
        <ActivityIndicator size="large" color="#007bff" style={{ flex: 1 }} />
      ) : (
        <ScrollView
          style={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* ENTRADAS */}
          {listaEntradas.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: "#00b894" }]}>
                  Entradas
                </Text>
                <Text style={[styles.sectionTotal, { color: "#00b894" }]}>
                  R$ {Math.abs(totalEntradas).toFixed(2).replace(".", ",")}
                </Text>
              </View>
              {listaEntradas.map((item) =>
                renderCategoriaItem(item, "#00b894")
              )}
            </>
          )}

          {/* GASTOS OPERACIONAIS */}
          {listaGastos.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Gastos Operacionais</Text>
                <Text style={[styles.sectionTotal, { color: "#d63031" }]}>
                  R$ {Math.abs(totalGastos).toFixed(2).replace(".", ",")}
                </Text>
              </View>
              {listaGastos.map(
                (item) => renderCategoriaItem(item, "#00b894") // Barra verde por padrão
              )}
            </>
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
              {listaInicio.map((item) => renderCategoriaItem(item, "#6c5ce7"))}
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
                  item.valor >= 0 ? "#00b894" : "#d63031" // Mantém a lógica de cor da barra para empréstimos
                )
              )}
            </>
          )}

          {/* Mensagem de "Nenhum dado encontrado" se todas as listas estiverem vazias */}
          {listaGastos.length === 0 &&
            listaEmprestimos.length === 0 &&
            listaInicio.length === 0 &&
            listaEntradas.length === 0 && (
              <Text style={styles.emptyText}>Nenhum dado encontrado.</Text>
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
