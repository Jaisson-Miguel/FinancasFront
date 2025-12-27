import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import Header from "./../../components/Header";
import API_URL from "./../../config"; // Importando a configuração do IP

export default function CriarCaixa({ navigation }) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSalvar = async () => {
    if (!nome) {
      Alert.alert("Erro", "Por favor, informe o nome da caixa.");
      return;
    }

    // --- NOVA VALIDAÇÃO ---
    // Verifica se o nome é "Principal" (ignorando maiúsculas/minúsculas e espaços)
    if (nome.trim().toLowerCase() === "principal") {
      Alert.alert(
        "Ação Negada",
        "O nome 'Principal' é reservado para o sistema. Por favor, escolha outro nome."
      );
      return;
    }
    // ---------------------

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/caixas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome,
          descricao,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Sucesso", "Caixa criada com sucesso!");
        navigation.goBack();
      } else {
        Alert.alert("Erro", data.error || "Não foi possível criar a caixa.");
      }
    } catch (error) {
      console.log(error);
      Alert.alert("Erro", "Falha na conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Nova Caixa" />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>DADOS DA CAIXA</Text>

        {/* Nome da Caixa */}
        <Text style={styles.label}>NOME DA CAIXA</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Reserva de Emergência"
          placeholderTextColor="#a4b0be"
          value={nome}
          onChangeText={setNome}
        />

        {/* Descrição */}
        <Text style={styles.label}>DESCRIÇÃO (OPCIONAL)</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: "top" }]}
          placeholder="Ex: Dinheiro guardado para imprevistos..."
          placeholderTextColor="#a4b0be"
          multiline={true}
          numberOfLines={4}
          value={descricao}
          onChangeText={setDescricao}
        />

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[styles.btnSalvar, loading && { opacity: 0.7 }]}
          onPress={handleSalvar}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "SALVANDO..." : "CRIAR CAIXA"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#b2bec3",
    marginBottom: 20,
    marginTop: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#747d8c",
    marginBottom: 8,
    marginTop: 15,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#f1f2f6",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#2d3436",
    borderWidth: 1,
    borderColor: "transparent",
  },
  btnSalvar: {
    backgroundColor: "#2d3436",
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
