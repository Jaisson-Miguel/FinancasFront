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
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Header from "./../../components/Header";
import API_URL from "./../../config";

export default function GerenciarContas({ navigation }) {
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);

  const carregarTodasContas = async () => {
    try {
      setLoading(true);
      // Busca TODAS as contas (sem filtro de status)
      const response = await fetch(`${API_URL}/contas`);
      const data = await response.json();

      if (Array.isArray(data)) {
        // Ordena por vencimento
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
      carregarTodasContas();
    }, [])
  );

  const handleExcluir = (id) => {
    Alert.alert("Excluir", "Tem certeza que deseja apagar esta conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`${API_URL}/contas/${id}`, { method: "DELETE" });
            carregarTodasContas(); // Recarrega a lista
          } catch (error) {
            Alert.alert("Erro", "Não foi possível excluir.");
          }
        },
      },
    ]);
  };

  const handleEditar = (item) => {
    navigation.navigate("CriarConta", { contaParaEditar: item });
  };

  const renderItem = ({ item }) => {
    return (
      <View style={styles.card}>
        {/* Informações */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle}>{item.descricao}</Text>
          <Text style={styles.cardDate}>
            Vence:{" "}
            {new Date(item.dataVencimento).toLocaleDateString("pt-BR", {
              timeZone: "UTC",
            })}
          </Text>
          <Text
            style={[
              styles.cardStatus,
              item.status === "pago"
                ? { color: "#27ae60" }
                : { color: "#e67e22" },
            ]}
          >
            {item.status.toUpperCase()}
          </Text>
        </View>

        {/* Valor */}
        <View style={styles.cardValueContainer}>
          <Text style={styles.valueText}>
            R$ {item.valor.toFixed(2).replace(".", ",")}
          </Text>
        </View>

        {/* Ações (Editar / Excluir) */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#f39c12" }]}
            onPress={() => handleEditar(item)}
          >
            <FontAwesome name="pencil" size={16} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: "#c0392b" }]}
            onPress={() => handleExcluir(item._id)}
          >
            <FontAwesome name="trash" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Header title="Gerenciar Contas" />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#2d3436"
          style={{ marginTop: 50 }}
        />
      ) : (
        <FlatList
          data={contas}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma conta registrada.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f6fa",
  },
  listContent: {
    padding: 15,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    elevation: 2,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3436",
  },
  cardDate: {
    fontSize: 12,
    color: "#636e72",
    marginTop: 2,
  },
  cardStatus: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 2,
  },
  cardValueContainer: {
    marginRight: 15,
  },
  valueText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2d3436",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 50,
  },
  emptyText: {
    color: "#b2bec3",
    fontSize: 16,
  },
});
