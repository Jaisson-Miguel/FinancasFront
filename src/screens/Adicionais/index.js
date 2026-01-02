// src/screens/AdicionaisScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
  ActivityIndicator,
  ScrollView, // Adicionado ScrollView para melhor agrupamento
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import API_URL from "./../../config"; // ou use dotenv se preferir
import Header from "./../../components/Header";

export default function Adicionais({ navigation }) {
  const [adicionais, setAdicionais] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editando, setEditando] = useState(null);
  const [chave, setChave] = useState("");
  const [valor, setValor] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [grupo, setGrupo] = useState("");

  // Novo estado para armazenar os adicionais agrupados
  const [adicionaisAgrupados, setAdicionaisAgrupados] = useState({});

  const limparCampos = () => {
    setChave("");
    setValor("");
    setConteudo("");
    setGrupo("");
    setEditando(null);
  };

  const abrirModal = (item = null) => {
    if (item) {
      setEditando(item);
      setChave(item.chave);
      setValor(item.valor !== undefined ? String(item.valor) : ""); // Converte para string para TextInput
      setConteudo(item.conteudo !== undefined ? item.conteudo : "");
      setGrupo(item.grupo !== undefined ? item.grupo : "");
    } else {
      limparCampos(); // Limpa campos ao adicionar novo
    }
    setModalVisible(true);
  };

  const carregarAdicionais = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/adicionais`);
      const data = await res.json();
      setAdicionais(data); // Mantém o array original

      // --- Lógica para agrupar os adicionais ---
      const agrupados = data.reduce((acc, item) => {
        const grupoAtual = item.grupo || "Sem Grupo"; // Define um grupo padrão se não houver
        if (!acc[grupoAtual]) {
          acc[grupoAtual] = [];
        }
        acc[grupoAtual].push(item);
        return acc;
      }, {});
      setAdicionaisAgrupados(agrupados);
      // --- Fim da lógica de agrupamento ---
    } catch (error) {
      console.error("Erro ao carregar adicionais:", error);
      Alert.alert("Erro", "Não foi possível carregar os adicionais.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarAdicionais();
  }, []);

  const salvarAdicional = async () => {
    if (!chave.trim() || (!valor.trim() && !conteudo.trim())) {
      Alert.alert(
        "Erro",
        "Chave e pelo menos um dos campos (Valor ou Conteúdo) são obrigatórios."
      );
      return;
    }

    setLoading(true);
    try {
      const method = editando ? "PUT" : "POST";
      const url = editando
        ? `${API_URL}/adicionais/${editando._id}`
        : `${API_URL}/adicionais`;

      const bodyData = {
        chave: chave.trim(),
        valor:
          valor.trim() === "" ? undefined : parseFloat(valor.replace(",", ".")), // Envia undefined se vazio
        conteudo: conteudo.trim() === "" ? undefined : conteudo.trim(), // Envia undefined se vazio
        grupo: grupo.trim() === "" ? "geral" : grupo.trim(), // Define "geral" como padrão se vazio
      };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Erro ao salvar adicional.");
      }

      Alert.alert(
        "Sucesso",
        `Adicional ${editando ? "atualizado" : "criado"} com sucesso!`
      );
      setModalVisible(false);
      limparCampos();
      carregarAdicionais(); // Recarrega a lista
    } catch (error) {
      console.error("Erro ao salvar adicional:", error);
      Alert.alert(
        "Erro",
        error.message || "Não foi possível salvar o adicional."
      );
    } finally {
      setLoading(false);
    }
  };

  const excluirAdicional = async (id) => {
    Alert.alert(
      "Confirmar Exclusão",
      "Tem certeza que deseja excluir este adicional?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          onPress: async () => {
            setLoading(true);
            try {
              const res = await fetch(`${API_URL}/adicionais/${id}`, {
                method: "DELETE",
              });

              if (!res.ok) {
                const errorData = await res.json();
                throw new Error(
                  errorData.message || "Erro ao excluir adicional."
                );
              }

              Alert.alert("Sucesso", "Adicional excluído com sucesso!");
              carregarAdicionais(); // Recarrega a lista
            } catch (error) {
              console.error("Erro ao excluir adicional:", error);
              Alert.alert(
                "Erro",
                error.message || "Não foi possível excluir o adicional."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Componente para renderizar cada item de adicional
  const renderAdicionalItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <Text style={styles.chave}>{item.chave}</Text>
        {item.valor !== undefined && (
          <Text style={styles.valor}>
            Valor: {item.valor.toFixed(2).replace(".", ",")}
          </Text>
        )}
        {item.conteudo && (
          <Text style={styles.conteudo}>Conteúdo: {item.conteudo}</Text>
        )}
        {item.grupo && <Text style={styles.grupo}>Grupo: {item.grupo}</Text>}
      </View>
      <View style={styles.botoes}>
        <TouchableOpacity
          style={styles.btnEditar}
          onPress={() => abrirModal(item)}
        >
          <FontAwesome name="pencil" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btnExcluir}
          onPress={() => excluirAdicional(item._id)}
        >
          <FontAwesome name="trash" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Header title="Adicionais" navigation={navigation} />

      {loading && adicionais.length === 0 ? ( // Mostra o loader apenas se estiver carregando e a lista estiver vazia
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00b894" />
          <Text style={styles.loadingText}>Carregando adicionais...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {Object.keys(adicionaisAgrupados).length === 0 ? (
            <Text style={styles.emptyText}>Nenhum adicional encontrado.</Text>
          ) : (
            // Mapeia sobre os grupos e renderiza cada um
            Object.keys(adicionaisAgrupados)
              .sort()
              .map((grupoNome) => (
                <View key={grupoNome} style={styles.grupoContainer}>
                  <Text style={styles.grupoTitulo}>{grupoNome}</Text>
                  <FlatList
                    data={adicionaisAgrupados[grupoNome]}
                    keyExtractor={(item) => item._id}
                    renderItem={renderAdicionalItem}
                    scrollEnabled={false} // Desabilita o scroll da FlatList interna
                  />
                </View>
              ))
          )}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => abrirModal()}>
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
          limparCampos();
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>
              {editando ? "Editar Adicional" : "Novo Adicional"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Chave (ex: MetaAlimentacao)"
              value={chave}
              onChangeText={setChave}
              editable={!editando} // Chave não editável após a criação
            />
            <TextInput
              style={styles.input}
              placeholder="Valor (opcional, ex: 30.50)"
              keyboardType="numeric"
              value={valor}
              onChangeText={(text) => setValor(text.replace(",", "."))} // Permite vírgula, mas armazena ponto
            />
            <TextInput
              style={styles.input}
              placeholder="Conteúdo (opcional)"
              value={conteudo}
              onChangeText={setConteudo}
            />
            <TextInput
              style={styles.input}
              placeholder="Grupo (opcional)"
              value={grupo}
              onChangeText={setGrupo}
            />

            <View style={styles.modalBotoes}>
              <TouchableOpacity
                style={styles.btnCancelar}
                onPress={() => {
                  setModalVisible(false);
                  limparCampos();
                }}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.btnSalvar}
                onPress={salvarAdicional}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.btnText}>Salvar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 100, // Aumenta o padding para o FAB não cobrir o último item
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
  emptyText: {
    textAlign: "center",
    color: "#b2bec3",
    marginTop: 30,
    marginBottom: 20,
    fontStyle: "italic",
  },
  // --- Novos estilos para agrupamento ---
  grupoContainer: {
    marginBottom: 25, // Espaçamento entre os grupos
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 15,
    paddingHorizontal: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  grupoTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 15,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#dfe6e9",
    paddingBottom: 10,
  },
  // --- Fim dos novos estilos ---
  card: {
    flexDirection: "row",
    backgroundColor: "#fdfdfd", // Cor mais clara para o card dentro do grupo
    padding: 15,
    borderRadius: 10, // Bordas um pouco menos arredondadas que o grupo
    marginBottom: 10, // Espaçamento entre os cards dentro do grupo
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 1, // Sombra mais suave para o card
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  cardContent: {
    flex: 1,
    marginRight: 10,
  },
  chave: {
    fontSize: 17, // Ajustado para se encaixar melhor
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 2,
  },
  valor: {
    fontSize: 14, // Ajustado
    color: "#0984e3",
    marginBottom: 2,
  },
  conteudo: {
    fontSize: 13, // Ajustado
    color: "#636e72",
    marginBottom: 2,
  },
  grupo: {
    fontSize: 12, // Ajustado
    fontStyle: "italic",
    color: "#b2bec3",
  },
  botoes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  btnEditar: {
    backgroundColor: "#a29bfe",
    padding: 7, // Ajustado
    borderRadius: 5, // Ajustado
    justifyContent: "center",
    alignItems: "center",
  },
  btnExcluir: {
    backgroundColor: "#ff7675",
    padding: 7, // Ajustado
    borderRadius: 5, // Ajustado
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#00b894",
    width: 56, // Ajustado para um tamanho mais comum de FAB
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 25,
    width: "90%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
  },
  modalTitulo: {
    fontSize: 20, // Ajustado
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#2d3436",
  },
  input: {
    borderWidth: 1,
    borderColor: "#dfe6e9",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    fontSize: 15, // Ajustado
    color: "#2d3436",
    backgroundColor: "#fdfdfd",
  },
  modalBotoes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  btnSalvar: {
    backgroundColor: "#00b894",
    padding: 12, // Ajustado
    borderRadius: 8,
    flex: 1,
    marginRight: 5, // Ajustado
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelar: {
    backgroundColor: "#d63031",
    padding: 12, // Ajustado
    borderRadius: 8,
    flex: 1,
    marginLeft: 5, // Ajustado
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 15, // Ajustado
  },
});
