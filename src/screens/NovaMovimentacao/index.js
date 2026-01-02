import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Header from "./../../components/Header";
import API_URL from "./../../config";

// Lista fixa de categorias
const CATEGORIAS_DISPONIVEIS = [
  "Outros",
  "Fixo",
  "Luxo",
  "Dízimo",
  "Lazer",
  "Educação",
  "Investimento",
  "Reserva",
  "Metas",
  "Entrada",
  "Empréstimos",
  "Inicio",
];

export default function NovaMovimentacao({ route, navigation }) {
  // Recebe dados (se for criação, vem caixaId; se for edição, vem movimentacao)
  const { caixaId, caixaNome, movimentacao } = route.params || {};

  const [idEdicao, setIdEdicao] = useState(null);
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("entrada"); // 'entrada' ou 'saida'
  const [categoria, setCategoria] = useState("Geral");
  const [observacao, setObservacao] = useState("");
  const [loading, setLoading] = useState(false);

  // --- CARREGAR DADOS SE FOR EDIÇÃO ---
  useEffect(() => {
    if (movimentacao) {
      setIdEdicao(movimentacao._id);
      setDescricao(movimentacao.descricao);

      // Carrega o valor absoluto (sem sinal negativo) para o input
      setValor(String(Math.abs(movimentacao.valor)));

      // Define o tipo baseado no sinal do valor original
      setTipo(movimentacao.valor < 0 ? "saida" : "entrada");

      setCategoria(movimentacao.categoria || "Geral");
      setObservacao(movimentacao.observacao || "");
    } else {
      // Se for nova movimentação, define padrão
      setCategoria("Geral");
    }
  }, [movimentacao]);

  const handleSalvar = async () => {
    if (!valor || !descricao) {
      Alert.alert("Erro", "Preencha valor e descrição.");
      return;
    }

    setLoading(true);

    try {
      // 1. Converte o texto para número
      let valorNumerico = parseFloat(valor.replace(",", "."));

      // 2. LÓGICA DE SINAL:
      // Se for saída, garante que seja negativo. Se for entrada, garante positivo.
      // Math.abs garante que pegamos o valor absoluto antes de aplicar o sinal.
      if (tipo === "saida") {
        valorNumerico = -Math.abs(valorNumerico);
      } else {
        valorNumerico = Math.abs(valorNumerico);
      }

      const payload = {
        caixaId: caixaId || (movimentacao ? movimentacao.caixaId : null),
        descricao,
        valor: valorNumerico, // Valor já com o sinal correto
        tipo,
        categoria,
        observacao,
      };

      let url = `${API_URL}/movimentacoes`;
      let method = "POST";

      if (idEdicao) {
        url = `${API_URL}/movimentacoes/${idEdicao}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        Alert.alert("Sucesso", "Movimentação salva!");
        navigation.goBack();
      } else {
        Alert.alert("Erro", "Falha ao salvar movimentação.");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      Alert.alert("Erro", "Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title={idEdicao ? "Editar Movimentação" : "Nova Movimentação"}
        showBack={true}
        navigation={navigation}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Exibe qual caixa está sendo afetado (apenas visual) */}
        {caixaNome && (
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.label}>Caixa Selecionado</Text>
            <View style={styles.caixaDisplay}>
              <Text style={styles.caixaDisplayText}>{caixaNome}</Text>
            </View>
          </View>
        )}

        {/* TIPO (Entrada / Saída) */}
        <Text style={styles.label}>Tipo de Movimentação</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity
            style={[
              styles.typeButton,
              tipo === "entrada" && styles.typeButtonEntradaActive,
            ]}
            onPress={() => setTipo("entrada")}
          >
            <Text
              style={[
                styles.typeText,
                tipo === "entrada" && styles.typeTextActive,
              ]}
            >
              ENTRADA
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeButton,
              tipo === "saida" && styles.typeButtonSaidaActive,
            ]}
            onPress={() => setTipo("saida")}
          >
            <Text
              style={[
                styles.typeText,
                tipo === "saida" && styles.typeTextActive,
              ]}
            >
              SAÍDA
            </Text>
          </TouchableOpacity>
        </View>

        {/* VALOR */}
        <Text style={styles.label}>Valor (R$)</Text>
        <TextInput
          style={styles.input}
          placeholder="0,00"
          keyboardType="numeric"
          value={valor}
          onChangeText={setValor}
        />

        {/* DESCRIÇÃO */}
        <Text style={styles.label}>Descrição</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Pagamento Fornecedor"
          value={descricao}
          onChangeText={setDescricao}
        />

        {/* CATEGORIA (Botões de Seleção) */}
        <Text style={styles.label}>Categoria</Text>
        <View style={styles.categoriasContainer}>
          {CATEGORIAS_DISPONIVEIS.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catButton,
                categoria === cat && styles.catButtonActive,
              ]}
              onPress={() => setCategoria(cat)}
            >
              <Text
                style={[
                  styles.catText,
                  categoria === cat && styles.catTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* OBSERVAÇÃO */}
        <Text style={styles.label}>Observação (Opcional)</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: "top" }]}
          placeholder="Detalhes adicionais..."
          multiline={true}
          numberOfLines={4}
          value={observacao}
          onChangeText={setObservacao}
        />

        <TouchableOpacity
          style={[styles.btnSalvar, loading && { opacity: 0.7 }]}
          onPress={handleSalvar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {idEdicao ? "SALVAR ALTERAÇÕES" : "CONFIRMAR"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 24, paddingBottom: 50 },
  label: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#747d8c",
    marginBottom: 8,
    marginTop: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  caixaDisplay: {
    backgroundColor: "#dfe6e9",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#b2bec3",
    justifyContent: "center",
  },
  caixaDisplayText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3436",
    textTransform: "uppercase",
  },
  typeContainer: { flexDirection: "row", gap: 15 },
  typeButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: "#f1f2f6",
    alignItems: "center",
  },
  typeButtonEntradaActive: { backgroundColor: "#00b894" },
  typeButtonSaidaActive: { backgroundColor: "#d63031" },
  typeText: { fontWeight: "bold", color: "#b2bec3", letterSpacing: 1 },
  typeTextActive: { color: "#fff" },
  input: {
    backgroundColor: "#f1f2f6",
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    color: "#2d3436",
  },
  inputDisabled: {
    backgroundColor: "#e0e0e0",
    color: "#a4b0be",
  },
  // --- ESTILOS DAS CATEGORIAS ---
  categoriasContainer: {
    flexDirection: "row",
    flexWrap: "wrap", // Permite quebrar linha
    gap: 10,
  },
  catButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#f1f2f6",
    borderWidth: 1,
    borderColor: "#dfe6e9",
  },
  catButtonActive: {
    backgroundColor: "#2d3436", // Cor escura ativa
    borderColor: "#2d3436",
  },
  catText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#636e72",
  },
  catTextActive: {
    color: "#fff",
  },
  btnSalvar: {
    backgroundColor: "#2d3436",
    paddingVertical: 18,
    borderRadius: 12,
    marginTop: 40,
    alignItems: "center",
    elevation: 5,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
