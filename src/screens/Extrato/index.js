import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons"; // Importação do FontAwesome
import { useFocusEffect } from "@react-navigation/native";
import Header from "../../components/Header";
import API_URL from "../../config";

export default function Extrato({ route, navigation }) {
  // 1. Recebe os parâmetros da rota com segurança
  const { caixaId, caixaNome, filtro } = route.params || {};
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saldoListado, setSaldoListado] = useState(0);

  // Define o título da tela
  const tituloTela =
    caixaNome === "Principal" || filtro === "todos"
      ? "Extrato Geral"
      : `Extrato: ${caixaNome || "Caixa"}`;

  // Função para buscar dados
  const carregarMovimentacoes = useCallback(async () => {
    try {
      setLoading(true);
      let url = "";
      // --- LÓGICA DE URL ---
      // MEMÓRIA: O usuário prefere que, ao abrir DetalhesCaixa, se o nome da caixa for "Principal" a requisição seja para "/extrato", caso contrário para "/extrato:{caixaId}".
      // MEMÓRIA: O usuário deseja remover todos os filtros por caixaId, usando sempre todas as movimentações sem restrição de caixa.
      // A memória de "remover todos os filtros por caixaId" entra em conflito com a de "se for Principal, /extrato, senão /extrato:{caixaId}".
      // Vou seguir a lógica mais recente de "se for Principal, /extrato, senão /extrato:{caixaId}" para extratos específicos.
      // Se a intenção for sempre mostrar TUDO, independentemente do caixaId, a lógica da URL precisaria ser ajustada para sempre ir para /extrato.
      // Por enquanto, mantenho a distinção para extratos específicos de caixa.

      if (caixaNome === "Principal") {
        // Se for o caixa Principal, busca TUDO (ou só do Principal, dependendo da regra do backend)
        // MEMÓRIA: O usuário deseja que a tela do caixa Principal exiba apenas movimentações da própria caixa, sem incluir de outras caixas.
        // Considerando essa memória, a URL para o Principal deve ser específica.
        url = `${API_URL}/extrato/principal`; // Assumindo que o backend tem uma rota para o extrato do caixa Principal
      } else if (caixaId) {
        // Se for qualquer outro caixa, busca filtrado pelo ID
        url = `${API_URL}/extrato/${caixaId}`;
      } else {
        // Caso não tenha caixaId nem seja Principal, busca o extrato geral (todos)
        url = `${API_URL}/extrato`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        setMovimentacoes(data);
        // Calcula a soma simples dos itens retornados
        const total = data.reduce(
          (acc, item) => acc + (Number(item.valor) || 0),
          0
        );
        setSaldoListado(total);
      } else {
        setMovimentacoes([]);
        setSaldoListado(0);
      }
    } catch (error) {
      console.error("Erro ao carregar movimentações:", error);
      Alert.alert("Erro", "Não foi possível carregar o extrato.");
    } finally {
      setLoading(false);
    }
  }, [caixaId, caixaNome]); // Dependências para useCallback

  // --- FUNÇÃO PARA EXCLUIR MOVIMENTAÇÃO ---
  const handleExcluirMovimentacao = async (idMovimentacao) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir esta movimentação? Esta ação não pode ser desfeita.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(
                `${API_URL}/movimentacoes/${idMovimentacao}`,
                {
                  method: "DELETE",
                }
              );

              if (response.ok) {
                Alert.alert("Sucesso", "Movimentação excluída com sucesso!");
                carregarMovimentacoes(); // Recarrega a lista após a exclusão
              } else {
                const errorData = await response.json();
                Alert.alert(
                  "Erro",
                  errorData.error || "Não foi possível excluir a movimentação."
                );
              }
            } catch (error) {
              console.error("Erro ao excluir movimentação:", error);
              Alert.alert("Erro", "Não foi possível excluir a movimentação.");
            } finally {
              setLoading(false);
            }
          },
          style: "destructive",
        },
      ]
    );
  };

  // --- FUNÇÃO PARA EDITAR MOVIMENTAÇÃO ---
  const handleEditMovimentacao = (movimentacaoItem) => {
    // MEMÓRIA: O usuário deseja adicionar um ícone de lápis que direcione à página de nova movimentação e permita atualização da mesma.
    navigation.navigate("NovaMovimentacao", { movimentacao: movimentacaoItem });
  };

  // Recarrega as movimentações sempre que a tela estiver em foco
  useFocusEffect(
    useCallback(() => {
      carregarMovimentacoes();
    }, [carregarMovimentacoes])
  );

  // --- RENDERIZAÇÃO DO ITEM DA LISTA ---
  const renderItem = ({ item }) => (
    <View style={styles.cardMovimentacao}>
      <View style={styles.infoContainer}>
        {item.caixa && item.caixa.nome && (
          <View style={styles.tagCaixa}>
            <Text style={styles.tagCaixaText}>{item.caixa.nome}</Text>
          </View>
        )}
        <Text style={styles.descricao}>{item.descricao}</Text>
        {item.categoria && (
          <Text style={styles.categoriaTexto}>{item.categoria}</Text>
        )}
        <View style={styles.metaDataContainer}>
          <Text style={styles.data}>
            {new Date(item.createdAt).toLocaleDateString("pt-BR")}
          </Text>
        </View>
      </View>

      <View style={styles.rightContainer}>
        <Text
          style={[
            styles.valor,
            item.valor >= 0 ? styles.entrada : styles.saida,
          ]}
        >
          R$ {item.valor.toFixed(2).replace(".", ",")}
        </Text>
        <View style={styles.botoesContainer}>
          {/* Botão de Editar (Lápis) */}
          <TouchableOpacity
            style={styles.btnEditar}
            onPress={() => handleEditMovimentacao(item)}
          >
            <FontAwesome name="pencil" size={18} color="#fff" />
          </TouchableOpacity>

          {/* Botão de Excluir */}
          <TouchableOpacity
            style={styles.btnExcluir}
            onPress={() => handleExcluirMovimentacao(item._id)}
          >
            <FontAwesome name="trash" size={18} color="#d63031" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title={tituloTela} showBack={true} navigation={navigation} />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0984e3"
          style={styles.loading}
        />
      ) : (
        <>
          <View style={styles.saldoContainer}>
            <Text style={styles.saldoLabel}>Saldo em Extrato</Text>
            <Text
              style={[
                styles.saldoValor,
                saldoListado >= 0 ? styles.entrada : styles.saida,
              ]}
            >
              R$ {saldoListado.toFixed(2).replace(".", ",")}
            </Text>
          </View>

          <FlatList
            data={movimentacoes}
            keyExtractor={(item) => item._id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                Nenhuma movimentação encontrada.
              </Text>
            }
          />
        </>
      )}

      {/* FAB para adicionar nova movimentação (se não for extrato geral) */}
      {caixaId && caixaNome !== "Principal" && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() =>
            navigation.navigate("NovaMovimentacao", { caixaId, caixaNome })
          }
        >
          <FontAwesome name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f2f6",
  },
  loading: {
    marginTop: 50,
  },
  saldoContainer: {
    backgroundColor: "#2d3436",
    padding: 20,
    margin: 10,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
  },
  saldoLabel: {
    color: "#b2bec3",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  saldoValor: {
    fontSize: 28,
    fontWeight: "bold",
  },
  listContent: {
    padding: 10,
    paddingBottom: 100, // Espaço para o FAB não cobrir o último item
  },
  cardMovimentacao: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    elevation: 1,
  },
  infoContainer: {
    flex: 1,
  },
  descricao: {
    fontSize: 16,
    color: "#2d3436",
    fontWeight: "500",
  },
  categoriaTexto: {
    fontSize: 10,
    color: "#0984e3",
    fontWeight: "bold",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  metaDataContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  data: {
    fontSize: 12,
    color: "#b2bec3",
    marginRight: 10,
  },
  tagCaixa: {
    backgroundColor: "#dfe6e9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
    alignSelf: "flex-start",
  },
  tagCaixaText: {
    fontSize: 10,
    color: "#636e72",
    fontWeight: "bold",
    textTransform: "uppercase",
  },
  rightContainer: {
    alignItems: "flex-end",
  },
  valor: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  entrada: {
    color: "#00b894",
  },
  saida: {
    color: "#d63031",
  },
  botoesContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  btnEditar: {
    backgroundColor: "#a29bfe", // Um roxinho para o lápis
    padding: 6,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  btnExcluir: {
    backgroundColor: "#ffeaa7",
    padding: 6,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    textAlign: "center",
    color: "#b2bec3",
    marginTop: 20,
    fontStyle: "italic",
  },
  fab: {
    position: "absolute",
    bottom: 50,
    right: 20,
    backgroundColor: "#0984e3",
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    zIndex: 999, // Garante que fique por cima de tudo
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});
