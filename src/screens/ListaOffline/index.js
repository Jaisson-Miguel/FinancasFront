import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useNetInfo } from "@react-native-community/netinfo";
import Header from "./../../components/Header";
import API_URL from "./../../config";

export default function ListaOffline({ navigation }) {
  const [lista, setLista] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null); // Para saber qual item está sendo enviado

  const netInfo = useNetInfo();

  const carregarPendencias = async () => {
    try {
      setLoading(true);
      const json = await AsyncStorage.getItem(
        "@financas:movimentacoes_offline"
      );
      if (json) {
        const dados = JSON.parse(json);
        dados.sort((a, b) => new Date(b.data) - new Date(a.data));
        setLista(dados);
      }
    } catch (error) {
      console.log("Erro ao ler pendências:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarPendencias();
    }, [])
  );

  // --- SINCRONIZAÇÃO MANUAL (UM POR UM) ---
  const handleEnviarItem = async (item) => {
    if (netInfo.isConnected === false) {
      Alert.alert("Sem Internet", "Conecte-se para enviar.");
      return;
    }

    setLoadingId(item.id); // Ativa o loading só neste botão

    try {
      const response = await fetch(`${API_URL}/movimentacoes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caixaId: item.caixaId,
          descricao: item.descricao,
          valor: item.valor,
          tipo: item.tipo,
          // AQUI ESTÁ O SEGREDO DA DATA:
          // Enviamos a data original que foi salva offline
          data: item.data,
        }),
      });

      if (response.ok) {
        // Se deu certo, removemos da lista e salvamos o novo estado
        const novaLista = lista.filter((i) => i.id !== item.id);
        setLista(novaLista);
        await AsyncStorage.setItem(
          "@financas:movimentacoes_offline",
          JSON.stringify(novaLista)
        );
        Alert.alert("Sucesso", "Movimentação lançada com a data original!");
      } else {
        const errorData = await response.json();
        Alert.alert("Erro", errorData.error || "O servidor recusou o envio.");
      }
    } catch (error) {
      console.log("Erro ao enviar:", error);
      Alert.alert("Erro", "Falha na conexão.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleExcluir = (id) => {
    Alert.alert("Excluir", "Deseja remover esta pendência?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          const novaLista = lista.filter((item) => item.id !== id);
          setLista(novaLista);
          await AsyncStorage.setItem(
            "@financas:movimentacoes_offline",
            JSON.stringify(novaLista)
          );
        },
      },
    ]);
  };

  const renderItem = ({ item }) => {
    const isEntrada = item.tipo === "entrada";
    const dataFormatada = new Date(item.data).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <View style={styles.card}>
        {/* Lado Esquerdo: Indicador e Ícone */}
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.indicator,
              { backgroundColor: isEntrada ? "#27ae60" : "#c0392b" },
            ]}
          />
          <View style={styles.iconContainer}>
            <FontAwesome
              name={isEntrada ? "arrow-up" : "arrow-down"}
              size={20}
              color={isEntrada ? "#27ae60" : "#c0392b"}
            />
          </View>
        </View>

        {/* Centro: Dados */}
        <View style={styles.cardCenter}>
          <Text style={styles.descricao}>{item.descricao}</Text>
          <Text style={styles.caixaNome}>
            {item.caixaNome || "Caixa Desconhecido"}
          </Text>
          <Text style={styles.data}>
            <FontAwesome name="clock-o" size={10} /> {dataFormatada}
          </Text>
        </View>

        {/* Lado Direito: Valor e Ações */}
        <View style={styles.cardRight}>
          <Text
            style={[styles.valor, { color: isEntrada ? "#27ae60" : "#c0392b" }]}
          >
            R$ {Math.abs(item.valor).toFixed(2).replace(".", ",")}
          </Text>

          <View style={styles.actionsRow}>
            {/* Botão EXCLUIR */}
            <TouchableOpacity
              style={styles.btnAction}
              onPress={() => handleExcluir(item.id)}
              disabled={loadingId === item.id}
            >
              <FontAwesome name="trash" size={18} color="#b2bec3" />
            </TouchableOpacity>

            {/* Botão ENVIAR (Manual) */}
            <TouchableOpacity
              style={[styles.btnAction, styles.btnSend]}
              onPress={() => handleEnviarItem(item)}
              disabled={loadingId !== null} // Bloqueia se já estiver enviando algo
            >
              {loadingId === item.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <FontAwesome name="cloud-upload" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerOffline}>
        <Header title="Pendências Offline" />
      </View>

      <View style={styles.content}>
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            Envie manualmente clicando na nuvem azul.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator
            size="large"
            color="#636e72"
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={lista}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <FontAwesome name="check-circle" size={50} color="#b2bec3" />
                <Text style={styles.emptyText}>Tudo limpo!</Text>
                <Text style={styles.emptySubText}>
                  Nenhuma pendência para enviar.
                </Text>
              </View>
            }
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f1f2f6",
  },
  headerOffline: {
    backgroundColor: "#636e72",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summary: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#dfe6e9",
    borderRadius: 8,
    alignItems: "center",
  },
  summaryText: {
    color: "#636e72",
    fontSize: 12,
    fontWeight: "bold",
  },
  listContent: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    padding: 15,
    alignItems: "center",
    elevation: 2,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 15,
  },
  indicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginRight: 10,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f1f2f6",
    justifyContent: "center",
    alignItems: "center",
  },
  cardCenter: {
    flex: 1,
  },
  descricao: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 2,
  },
  caixaNome: {
    fontSize: 10,
    color: "#636e72",
    marginBottom: 2,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  data: {
    fontSize: 10,
    color: "#b2bec3",
  },
  cardRight: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 50,
  },
  valor: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 5,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 15,
  },
  btnAction: {
    padding: 5,
  },
  btnSend: {
    backgroundColor: "#0984e3",
    padding: 8,
    borderRadius: 8,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#b2bec3",
    marginTop: 10,
  },
  emptySubText: {
    fontSize: 14,
    color: "#b2bec3",
  },
});
