import React, { useState, useCallback, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Header from "./../../components/Header";
import API_URL from "./../../config";

// Habilita LayoutAnimation para Android
if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function ContasAPagar({ navigation }) {
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedInstitutions, setExpandedInstitutions] = useState({});
  const [dadosAgrupados, setDadosAgrupados] = useState({});
  const [totalGeralContas, setTotalGeralContas] = useState(0);
  const [totalGeralAPagar, setTotalGeralAPagar] = useState(0);

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

        const agrupados = {};
        let somaTotalGeral = 0;
        let somaTotalAPagar = 0;

        data.forEach((conta) => {
          const instituicaoNome = conta.instituicao || "Outros";
          if (!agrupados[instituicaoNome]) {
            agrupados[instituicaoNome] = {
              totalInstituicao: 0,
              totalInstituicaoAPagar: 0,
              contas: [],
            };
          }

          agrupados[instituicaoNome].totalInstituicao += conta.valor;
          somaTotalGeral += conta.valor;

          if (conta.status !== "pago") {
            const valorParaPagar = conta.valorRestante ?? conta.valor;
            agrupados[instituicaoNome].totalInstituicaoAPagar += valorParaPagar;
            somaTotalAPagar += valorParaPagar;
          }
          agrupados[instituicaoNome].contas.push(conta);
        });

        setDadosAgrupados(agrupados);
        setTotalGeralContas(somaTotalGeral);
        setTotalGeralAPagar(somaTotalAPagar);
      } else {
        setContas([]);
        setDadosAgrupados({});
        setTotalGeralContas(0);
        setTotalGeralAPagar(0);
      }
    } catch (error) {
      console.log("Erro ao buscar contas:", error);
      Alert.alert("Erro", "Não foi possível carregar as contas.");
      setContas([]);
      setDadosAgrupados({});
      setTotalGeralContas(0);
      setTotalGeralAPagar(0);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarContas();
    }, [])
  );

  const toggleExpand = (instituicaoNome) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedInstitutions((prev) => ({
      ...prev,
      [instituicaoNome]: !prev[instituicaoNome],
    }));
  };

  const irParaPagamento = (item) => {
    if (item.status === "pago") {
      Alert.alert("Aviso", "Esta conta já está totalmente paga.");
      return;
    }
    navigation.navigate("TelaPagamento", { conta: item });
  };

  const irParaEdicao = (conta) => {
    // Assumindo que "CriarConta" é a tela que você usa para criar/editar contas
    navigation.navigate("CriarConta", { contaParaEditar: conta });
  };

  // Nova função para navegar para a tela GerenciarContas
  const irParaGerenciarContas = () => {
    navigation.navigate("GerenciarContas"); // Nome da sua tela de gerenciamento
  };

  const renderContaItem = ({ item }) => {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera a hora para comparação

    const vencimento = new Date(item.dataVencimento);
    vencimento.setHours(0, 0, 0, 0);

    let corStatus = "#f39c12"; // Laranja padrão para "a pagar"
    let textoStatus = "A PAGAR";
    let valorExibido = item.valorRestante ?? item.valor; // Valor a pagar ou total

    if (item.status === "pago") {
      corStatus = "#27ae60"; // Verde
      textoStatus = "PAGO";
      valorExibido = item.valor; // Se pago, exibe o valor total da conta
    } else if (vencimento < hoje) {
      corStatus = "#e74c3c"; // Vermelho
      textoStatus = "ATRASADA";
    }

    const dia = String(vencimento.getUTCDate()).padStart(2, "0");
    const mes = String(vencimento.getUTCMonth() + 1).padStart(2, "0");

    return (
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: corStatus }]}
        onPress={() => irParaPagamento(item)}
      >
        <View style={styles.cardLeft}>
          <Text style={styles.dayText}>{dia}</Text>
          <Text style={styles.monthText}>{mes}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.descricao}</Text>
          <Text style={[styles.cardStatus, { color: corStatus }]}>
            {textoStatus}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.labelValor}>
            {item.status === "pago" ? "Valor Total" : "Valor Restante"}
          </Text>
          <Text style={[styles.valueText, { color: corStatus }]}>
            R$ {valorExibido.toFixed(2).replace(".", ",")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderInstituicaoGroup = ({ item: instituicaoNome }) => {
    const instituicaoData = dadosAgrupados[instituicaoNome];
    const isExpanded = expandedInstitutions[instituicaoNome];

    if (!instituicaoData) return null;

    return (
      <View style={styles.instituicaoGroupContainer}>
        <TouchableOpacity
          style={styles.instHeader}
          onPress={() => toggleExpand(instituicaoNome)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.instName}>{instituicaoNome}</Text>
          </View>
          <View style={styles.instValuesContainer}>
            <View style={styles.instValueBlock}>
              <Text style={styles.instLabel}>Total</Text>
              <Text style={styles.instValueGray}>
                R${" "}
                {instituicaoData.totalInstituicao.toFixed(2).replace(".", ",")}
              </Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.instValueBlock}>
              <Text style={styles.instLabelDestaque}>A Pagar</Text>
              <Text style={styles.instValueDestaque}>
                R${" "}
                {instituicaoData.totalInstituicaoAPagar
                  .toFixed(2)
                  .replace(".", ",")}
              </Text>
            </View>
            <FontAwesome
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color="#636e72"
              style={{ marginLeft: 15 }}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <FlatList
            data={instituicaoData.contas}
            keyExtractor={(item) => item._id}
            renderItem={renderContaItem}
            scrollEnabled={false} // Importante para que o ScrollView pai gerencie o scroll
            contentContainerStyle={styles.contasListInsideGroup}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Contas a Pagar" />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0984e3" />
          <Text style={styles.loadingText}>Carregando contas...</Text>
        </View>
      ) : (
        <>
          <View style={styles.totalGeralContainer}>
            <View style={styles.totalGeralBlock}>
              <Text style={styles.totalGeralLabel}>Total Geral</Text>
              <Text style={styles.totalGeralValue}>
                R$ {totalGeralContas.toFixed(2).replace(".", ",")}
              </Text>
            </View>
            <View style={styles.verticalDivider} />
            <View style={styles.totalGeralBlock}>
              <Text style={styles.totalGeralLabelDestaque}>Total a Pagar</Text>
              <Text style={styles.totalGeralValueDestaque}>
                R$ {totalGeralAPagar.toFixed(2).replace(".", ",")}
              </Text>
            </View>
            {/* NOVO BOTÃO DE ENGRENAGEM AQUI */}
            <TouchableOpacity
              style={styles.settingsButton} // Novo estilo para o botão
              onPress={irParaGerenciarContas}
            >
              <FontAwesome name="cog" size={24} color="#636e72" />
            </TouchableOpacity>
          </View>

          {Object.keys(dadosAgrupados).length === 0 ? (
            <View style={styles.emptyContainer}>
              <FontAwesome name="check-circle-o" size={60} color="#b2bec3" />
              <Text style={styles.emptyText}>Nenhuma conta encontrada.</Text>
            </View>
          ) : (
            <FlatList
              data={Object.keys(dadosAgrupados).sort()}
              keyExtractor={(item) => item}
              renderItem={renderInstituicaoGroup}
              contentContainerStyle={styles.scrollContent}
            />
          )}
        </>
      )}

      {/* Botão FAB para adicionar nova conta */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate("CriarConta")}
      >
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f2f6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#636e72",
  },
  scrollContent: {
    padding: 15,
    paddingBottom: 80, // Espaço para o FAB
  },
  totalGeralContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 20,
    paddingVertical: 15,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    alignItems: "center", // Centraliza itens verticalmente
    justifyContent: "space-between", // Distribui espaço entre os itens
    paddingHorizontal: 20, // Adiciona padding horizontal
  },
  totalGeralBlock: {
    alignItems: "center",
  },
  totalGeralLabel: {
    fontSize: 12,
    color: "#b2bec3",
    fontWeight: "bold",
    marginBottom: 4,
  },
  totalGeralValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3436",
  },
  totalGeralLabelDestaque: {
    fontSize: 12,
    color: "#c0392b", // Vermelho para destaque
    fontWeight: "bold",
    marginBottom: 4,
  },
  totalGeralValueDestaque: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#c0392b", // Vermelho para destaque
  },
  // NOVO ESTILO PARA O BOTÃO DE ENGRENAGEM
  settingsButton: {
    padding: 8, // Área de toque maior
    borderRadius: 20, // Borda arredondada
    // backgroundColor: '#f1f2f6', // Opcional: um fundo leve para o botão
  },
  instituicaoGroupContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: "hidden",
  },
  instHeader: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fdfdfd",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
  },
  instName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3436",
  },
  instValuesContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  instValueBlock: {
    alignItems: "center",
    marginLeft: 15,
  },
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
  instValueGray: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#636e72",
  },
  instLabelDestaque: {
    fontSize: 10,
    color: "#c0392b",
    fontWeight: "bold",
    marginBottom: 2,
  },
  instValueDestaque: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#c0392b",
  },
  contasListInsideGroup: {
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 5,
  },
  card: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 10,
    padding: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    borderLeftWidth: 4,
    alignItems: "center",
  },
  cardLeft: {
    width: 45,
    alignItems: "center",
    marginRight: 10,
    paddingRight: 5,
    borderRightWidth: 1,
    borderRightColor: "#f1f2f6",
  },
  dayText: { fontSize: 18, fontWeight: "bold", color: "#2d3436" },
  monthText: { fontSize: 10, color: "#636e72", fontWeight: "bold" },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: "#2d3436" },
  cardStatus: { fontSize: 10, fontWeight: "bold", marginTop: 2 },
  cardRight: { alignItems: "flex-end", justifyContent: "center" },
  labelValor: { fontSize: 10, color: "#b2bec3" },
  valueText: { fontSize: 15, fontWeight: "bold" },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  emptyText: { marginTop: 10, color: "#b2bec3", fontSize: 16 },
  fab: {
    position: "absolute",
    bottom: 50,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0984e3",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
});
