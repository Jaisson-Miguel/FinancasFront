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
      setValor(item.valor);
      setConteudo(item.conteudo);
      setGrupo(item.grupo);
    }
    setModalVisible(true);
  };

  const carregarAdicionais = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/adicionais`);
      const data = await res.json();
      setAdicionais(data);
    } catch (err) {
      console.error("Erro ao carregar adicionais:", err);
      Alert.alert("Erro", "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  };

  const salvarAdicional = async () => {
    if (!chave) {
      Alert.alert("Atenção", "O campo 'chave' é obrigatório.");
      return;
    }
    const payload = { chave, valor, conteudo, grupo };
    try {
      setLoading(true);
      const url = editando
        ? `${API_URL}/adicionais/${editando._id}`
        : `${API_URL}/adicionais`;
      const method = editando ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erro ao salvar");
      }
      Alert.alert("Sucesso", editando ? "Atualizado!" : "Criado!");
      setModalVisible(false);
      limparCampos();
      carregarAdicionais();
    } catch (err) {
      console.error("Erro ao salvar:", err);
      Alert.alert("Erro", err.message);
    } finally {
      setLoading(false);
    }
  };

  const excluirAdicional = (id) => {
    Alert.alert("Confirmar", "Deseja excluir este registro?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            setLoading(true);
            const res = await fetch(`${API_URL}/adicionais/${id}`, {
              method: "DELETE",
            });
            if (!res.ok) throw new Error("Erro ao excluir");
            carregarAdicionais();
          } catch (err) {
            Alert.alert("Erro", err.message);
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  useEffect(() => {
    carregarAdicionais();
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Novo estilo para o conteúdo do card */}
        <Text style={styles.chave}>{item.chave}</Text>
        {item.valor ? (
          <Text style={styles.valor}>Valor: {item.valor}</Text>
        ) : null}
        {item.conteudo ? (
          <Text style={styles.conteudo}>{item.conteudo}</Text>
        ) : null}
        {item.grupo ? (
          <Text style={styles.grupo}>Grupo: {item.grupo}</Text>
        ) : null}
      </View>
      <View style={styles.botoes}>
        <TouchableOpacity
          onPress={() => abrirModal(item)}
          style={styles.btnEditar}
        >
          <FontAwesome name="pencil" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => excluirAdicional(item._id)}
          style={styles.btnExcluir}
        >
          <FontAwesome name="trash" size={18} color="#d63031" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <Header title="Adicionais" showBack={false} navigation={navigation} />

      {/* <Text style={styles.titulo}>Adicionais</Text> */}
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#0984e3"
          style={styles.loadingIndicator}
        />
      ) : (
        <FlatList
          data={adicionais}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.flatListContent}
          ListEmptyComponent={() => (
            <Text style={styles.emptyListText}>
              Nenhum adicional cadastrado.
            </Text>
          )}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => abrirModal()}>
        <FontAwesome name="plus" size={24} color="#fff" />
      </TouchableOpacity>
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitulo}>
              {editando ? "Editar Adicional" : "Novo Adicional"}
            </Text>
            <TextInput
              placeholder="Chave"
              placeholderTextColor="#b2bec3" // Adicionado placeholderTextColor
              value={chave}
              onChangeText={setChave}
              style={styles.input}
            />
            <TextInput
              placeholder="Valor"
              placeholderTextColor="#b2bec3"
              value={valor}
              onChangeText={setValor}
              style={styles.input}
            />
            <TextInput
              placeholder="Conteúdo"
              placeholderTextColor="#b2bec3"
              value={conteudo}
              onChangeText={setConteudo}
              style={styles.input}
            />
            <TextInput
              placeholder="Grupo"
              placeholderTextColor="#b2bec3"
              value={grupo}
              onChangeText={setGrupo}
              style={styles.input}
            />
            <View style={styles.modalBotoes}>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  limparCampos();
                }}
                style={styles.btnCancelar}
              >
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={salvarAdicional}
                style={styles.btnSalvar}
              >
                <Text style={styles.btnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: "#f1f2f6", // Cor de fundo geral da tela
  },
  container: {
    // Este estilo foi renomeado para screenContainer, mas mantido caso você o use em outro lugar
    flex: 1,
    backgroundColor: "#f1f2f6",
    paddingHorizontal: 20, // Ajustado para padding horizontal
    paddingTop: 20, // Adicionado padding superior para o título
  },
  titulo: {
    fontSize: 28, // Aumentei um pouco o tamanho do título
    fontWeight: "bold",
    marginBottom: 25, // Aumentei a margem inferior
    textAlign: "center",
    color: "#2d3436", // Cor mais escura para o título
  },
  loadingIndicator: {
    marginTop: 50, // Centraliza o indicador de carregamento
  },
  flatListContent: {
    paddingBottom: 100, // Garante espaço para o FAB não cobrir o último item
    paddingHorizontal: 0, // Remove padding horizontal extra se o container já tiver
  },
  emptyListText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    color: "#636e72",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12, // Bordas mais arredondadas
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // Alinha itens verticalmente no centro
    elevation: 3, // Sombra Android
    shadowColor: "#000", // Sombra iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
  },
  cardContent: {
    flex: 1, // Permite que o conteúdo ocupe o espaço disponível
    marginRight: 10, // Espaçamento entre o conteúdo e os botões
  },
  chave: {
    fontSize: 18, // Aumentei o tamanho da chave
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 2, // Pequena margem para separar do valor
  },
  valor: {
    fontSize: 15,
    color: "#0984e3",
    marginBottom: 2,
  },
  conteudo: {
    fontSize: 14,
    color: "#636e72",
    marginBottom: 2,
  },
  grupo: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#b2bec3",
  },
  botoes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10, // Espaçamento entre os botões de editar e excluir
  },
  btnEditar: {
    backgroundColor: "#a29bfe", // Cor que você já definiu
    padding: 8, // Aumentei um pouco o padding
    borderRadius: 6, // Bordas mais arredondadas
    justifyContent: "center",
    alignItems: "center",
  },
  btnExcluir: {
    backgroundColor: "#ff7675", // Mudei para uma cor mais vibrante para exclusão, similar ao valorNegativo
    padding: 8,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: "#00b894", // Mudei para a cor de "Novo Lançamento" do Painel Principal
    width: 60, // Aumentei um pouco o tamanho
    height: 60,
    borderRadius: 30, // Metade da largura/altura para ser um círculo perfeito
    alignItems: "center",
    justifyContent: "center",
    elevation: 6, // Sombra mais proeminente para o FAB
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Fundo semi-transparente mais escuro
    justifyContent: "center",
    alignItems: "center", // Centraliza o modal horizontalmente
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16, // Bordas mais arredondadas para o modal
    padding: 25, // Aumentei o padding
    width: "90%", // Largura do modal
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,
  },
  modalTitulo: {
    fontSize: 22, // Aumentei o tamanho do título do modal
    fontWeight: "bold",
    marginBottom: 20, // Aumentei a margem inferior
    textAlign: "center",
    color: "#2d3436",
  },
  input: {
    borderWidth: 1,
    borderColor: "#dfe6e9", // Cor de borda mais suave
    borderRadius: 8, // Bordas mais arredondadas para os inputs
    padding: 12, // Aumentei o padding
    marginBottom: 15, // Aumentei a margem inferior
    fontSize: 16,
    color: "#2d3436",
    backgroundColor: "#fdfdfd", // Levemente diferente do fundo
  },
  modalBotoes: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 10,
  },
  btnSalvar: {
    backgroundColor: "#00b894", // Cor de sucesso
    padding: 14, // Aumentei o padding
    borderRadius: 8,
    flex: 1,
    marginRight: 10, // Espaçamento entre os botões
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelar: {
    backgroundColor: "#d63031", // Cor de perigo
    padding: 14,
    borderRadius: 8,
    flex: 1,
    marginLeft: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  btnText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16, // Aumentei o tamanho do texto do botão
  },
});
