import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Header from "./../../components/Header";
import API_URL from "./../../config";

export default function ContasAPagar({ navigation }) {
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState("contas"); // 'contas' ou 'instituicoes'

  const carregarContas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/contas`);
      const data = await response.json();

      if (Array.isArray(data)) {
        data.sort(
          (a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento)
        );
        setContas(data);
      } else {
        setContas([]);
      }
    } catch (error) {
      console.log("Erro ao buscar contas:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarContas();
    }, [])
  );

  // --- NAVEGAÇÃO PARA PAGAMENTO ---
  const irParaPagamento = (item) => {
    if (item.status === "pago") {
      Alert.alert("Aviso", "Esta conta já está totalmente paga.");
      return;
    }
    // Navega para a nova tela passando o objeto da conta
    navigation.navigate("TelaPagamento", { conta: item });
  };

  // --- AGRUPAMENTO POR INSTITUIÇÃO ---
  const dadosInstituicoes = useMemo(() => {
    const grupos = {};
    contas.forEach((conta) => {
      const nome = conta.instituicao || "Outros";
      if (!grupos[nome]) {
        grupos[nome] = { nome, totalHistorico: 0, totalAPagar: 0 };
      }
      grupos[nome].totalHistorico += conta.valor;

      // Soma o que falta (se status não for pago)
      // Usa valorRestante se existir, senão usa valor total
      const restante =
        conta.status === "pago" ? 0 : conta.valorRestante ?? conta.valor;
      grupos[nome].totalAPagar += restante;
    });
    return Object.values(grupos).sort((a, b) => b.totalAPagar - a.totalAPagar);
  }, [contas]);

  // --- RENDERIZAÇÃO ---
  const renderConta = ({ item }) => {
    let corStatus = "#2d3436";
    let textoStatus = "PENDENTE";
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(item.dataVencimento);
    vencimento.setHours(0, 0, 0, 0);

    if (item.status === "pago") {
      corStatus = "#27ae60";
      textoStatus = "PAGO";
    } else if (item.status === "parcial") {
      corStatus = "#f39c12";
      textoStatus = "PARCIAL";
    } else if (vencimento < hoje) {
      corStatus = "#c0392b";
      textoStatus = "VENCIDA";
    }

    const valorExibir =
      item.status === "pago" ? item.valor : item.valorRestante ?? item.valor;

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: corStatus }]}
        onPress={() => irParaPagamento(item)}
      >
        <View style={styles.cardDate}>
          <Text style={[styles.dayText, { color: corStatus }]}>
            {new Date(item.dataVencimento).getUTCDate()}
          </Text>
          <Text style={styles.monthText}>
            {new Date(item.dataVencimento)
              .toLocaleString("pt-BR", { month: "short", timeZone: "UTC" })
              .toUpperCase()
              .replace(".", "")}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.descricao}</Text>
          <Text style={styles.instTextSmall}>{item.instituicao}</Text>
          <Text style={[styles.cardStatus, { color: corStatus }]}>
            {textoStatus}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.labelValor}>
            {item.status === "pago" ? "Valor Total" : "Falta Pagar"}
          </Text>
          <Text style={[styles.valueText, { color: corStatus }]}>
            R$ {valorExibir.toFixed(2).replace(".", ",")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderInstituicao = ({ item }) => (
    <View style={styles.cardInstituicao}>
      <View style={styles.instHeader}>
        <Text style={styles.instName}>{item.nome}</Text>
        <FontAwesome name="building-o" size={20} color="#2d3436" />
      </View>
      <View style={styles.instValuesContainer}>
        <View style={styles.instValueBlock}>
          <Text style={styles.instLabelDestaque}>A PAGAR (RESTANTE)</Text>
          <Text style={styles.instValueDestaque}>
            R$ {item.totalAPagar.toFixed(2).replace(".", ",")}
          </Text>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.instValueBlock}>
          <Text style={styles.instLabel}>TOTAL HISTÓRICO</Text>
          <Text style={styles.instValueGray}>
            R$ {item.totalHistorico.toFixed(2).replace(".", ",")}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Contas a Pagar" />

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, abaAtiva === "contas" && styles.tabBtnActive]}
          onPress={() => setAbaAtiva("contas")}
        >
          <Text
            style={[
              styles.tabText,
              abaAtiva === "contas" && styles.tabTextActive,
            ]}
          >
            MINHAS CONTAS
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabBtn,
            abaAtiva === "instituicoes" && styles.tabBtnActive,
          ]}
          onPress={() => setAbaAtiva("instituicoes")}
        >
          <Text
            style={[
              styles.tabText,
              abaAtiva === "instituicoes" && styles.tabTextActive,
            ]}
          >
            POR INSTITUIÇÃO
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.gearBtn}
          onPress={() => navigation.navigate("GerenciarContas")}
        >
          <FontAwesome name="cog" size={20} color="#636e72" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2d3436"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={abaAtiva === "contas" ? contas : dadosInstituicoes}
          keyExtractor={(item, index) =>
            abaAtiva === "contas"
              ? item._id || index.toString()
              : item.nome || index.toString()
          }
          renderItem={abaAtiva === "contas" ? renderConta : renderInstituicao}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum registro encontrado.</Text>
            </View>
          }
        />
      )}

      {abaAtiva === "contas" && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("CriarConta")}
        >
          <FontAwesome name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f6fa" },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 10,
    marginHorizontal: 15,
    marginTop: 15,
    marginBottom: 5,
    borderRadius: 10,
    elevation: 2,
    alignItems: "center",
    gap: 10,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    backgroundColor: "#f1f2f6",
  },
  tabBtnActive: { backgroundColor: "#2d3436" },
  tabText: { fontWeight: "bold", color: "#b2bec3", fontSize: 12 },
  tabTextActive: { color: "#fff" },
  gearBtn: { padding: 10 },
  listContent: { paddingHorizontal: 15, paddingBottom: 80, paddingTop: 10 },
  // Card Conta
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    elevation: 2,
    borderLeftWidth: 5,
  },
  cardDate: {
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
    width: 40,
  },
  dayText: { fontSize: 18, fontWeight: "bold" },
  monthText: { fontSize: 10, color: "#636e72", fontWeight: "bold" },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#2d3436" },
  instTextSmall: {
    fontSize: 10,
    color: "#636e72",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  cardStatus: { fontSize: 10, fontWeight: "bold" },
  cardRight: { alignItems: "flex-end", justifyContent: "center" },
  labelValor: { fontSize: 10, color: "#b2bec3" },
  valueText: { fontSize: 16, fontWeight: "bold" },
  // Card Instituição
  cardInstituicao: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    padding: 15,
    elevation: 2,
    borderLeftWidth: 5,
    borderLeftColor: "#0984e3",
  },
  instHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
    paddingBottom: 10,
  },
  instName: { fontSize: 18, fontWeight: "bold", color: "#2d3436" },
  instValuesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  instValueBlock: { flex: 1, alignItems: "center" },
  verticalDivider: {
    width: 1,
    height: "80%",
    backgroundColor: "#dfe6e9",
    marginHorizontal: 10,
  },
  instLabel: {
    fontSize: 10,
    color: "#b2bec3",
    fontWeight: "bold",
    marginBottom: 2,
  },
  instValueGray: { fontSize: 14, fontWeight: "bold", color: "#636e72" },
  instLabelDestaque: {
    fontSize: 10,
    color: "#c0392b",
    fontWeight: "bold",
    marginBottom: 2,
  },
  instValueDestaque: { fontSize: 18, fontWeight: "bold", color: "#c0392b" },
  // Outros
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  emptyText: { marginTop: 10, color: "#b2bec3", fontSize: 16 },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2d3436",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});
