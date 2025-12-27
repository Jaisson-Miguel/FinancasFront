import React, { useState, useCallback } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import Header from "./../../components/Header";
import API_URL from "./../../config";

export default function CriarConta({ navigation, route }) {
  const [instituicao, setInstituicao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [observacao, setObservacao] = useState(""); // Novo Estado
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [status, setStatus] = useState("pendente");
  const [loading, setLoading] = useState(false);
  const [idEdicao, setIdEdicao] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const conta = route.params?.contaParaEditar;

      if (conta) {
        // MODO EDIÇÃO
        setIdEdicao(conta._id);
        setInstituicao(conta.instituicao || "");
        setDescricao(conta.descricao);
        setObservacao(conta.observacao || ""); // Carrega observação existente
        setValor(conta.valor ? conta.valor.toString().replace(".", ",") : "");
        setStatus(conta.status || "pendente");

        if (conta.dataVencimento) {
          const dataObj = new Date(conta.dataVencimento);
          const dia = String(dataObj.getUTCDate()).padStart(2, "0");
          const mes = String(dataObj.getUTCMonth() + 1).padStart(2, "0");
          const ano = dataObj.getUTCFullYear();
          setDataVencimento(`${dia}/${mes}/${ano}`);
        }
      } else {
        // MODO CRIAÇÃO
        setIdEdicao(null);
        setInstituicao("");
        setDescricao("");
        setObservacao(""); // Limpa observação
        setValor("");
        setDataVencimento("");
        setStatus("pendente");
      }
    }, [route.params])
  );

  const handleDateChange = (text) => {
    let numbers = text.replace(/\D/g, "");
    if (numbers.length > 2) {
      numbers = numbers.substring(0, 2) + "/" + numbers.substring(2);
    }
    if (numbers.length > 5) {
      numbers = numbers.substring(0, 5) + "/" + numbers.substring(5, 9);
    }
    setDataVencimento(numbers);
  };

  const handleSalvar = async () => {
    if (!instituicao || !descricao || !valor || !dataVencimento) {
      Alert.alert(
        "Erro",
        "Preencha os campos obrigatórios (Instituição, Descrição, Valor e Data)!"
      );
      return;
    }

    if (dataVencimento.length < 10) {
      Alert.alert("Erro", "Data inválida. Use o formato DD/MM/AAAA");
      return;
    }

    setLoading(true);

    try {
      const valorFormatado = parseFloat(valor.replace(",", "."));
      if (isNaN(valorFormatado)) {
        Alert.alert("Erro", "Valor inválido.");
        setLoading(false);
        return;
      }

      const [dia, mes, ano] = dataVencimento.split("/");
      const dataISO = new Date(
        `${ano}-${mes}-${dia}T12:00:00.000Z`
      ).toISOString();

      let url = `${API_URL}/contas`;
      let method = "POST";

      if (idEdicao) {
        url = `${API_URL}/contas/${idEdicao}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          instituicao,
          descricao,
          observacao, // Envia a observação para o backend
          valor: valorFormatado,
          dataVencimento: dataISO,
          status: status,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          "Sucesso",
          idEdicao ? "Conta atualizada!" : "Conta agendada!"
        );
        navigation.goBack();
      } else {
        Alert.alert("Erro", data.error || "Não foi possível salvar.");
      }
    } catch (error) {
      console.log("Erro ao salvar conta:", error);
      Alert.alert("Erro", "Falha na conexão.");
    } finally {
      setLoading(false);
    }
  };

  const StatusButton = ({ label, value, color }) => (
    <TouchableOpacity
      style={[
        styles.statusBtn,
        status === value && { backgroundColor: color, borderColor: color },
      ]}
      onPress={() => setStatus(value)}
    >
      <Text
        style={[
          styles.statusBtnText,
          status === value ? { color: "#fff" } : { color: color },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Header title={idEdicao ? "Editar Conta" : "Nova Conta"} />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Instituição */}
        <Text style={styles.label}>INSTITUIÇÃO / LOJA</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Nubank, Casas Bahia, Banco X"
          placeholderTextColor="#a4b0be"
          value={instituicao}
          onChangeText={setInstituicao}
        />

        {/* Descrição */}
        <Text style={styles.label}>DESCRIÇÃO DA CONTA</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Parcela 1/10, Fatura Mensal"
          placeholderTextColor="#a4b0be"
          value={descricao}
          onChangeText={setDescricao}
        />

        {/* Observação (Novo Campo) */}
        <Text style={styles.label}>OBSERVAÇÃO (OPCIONAL)</Text>
        <TextInput
          style={[styles.input, { height: 80, textAlignVertical: "top" }]}
          placeholder="Detalhes extras..."
          placeholderTextColor="#a4b0be"
          multiline={true}
          numberOfLines={3}
          value={observacao}
          onChangeText={setObservacao}
        />

        {/* Valor */}
        <Text style={styles.label}>VALOR (R$)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="0,00"
          placeholderTextColor="#a4b0be"
          value={valor}
          onChangeText={setValor}
        />

        {/* Data de Vencimento */}
        <Text style={styles.label}>VENCIMENTO (DD/MM/AAAA)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="Dia/Mês/Ano"
          placeholderTextColor="#a4b0be"
          maxLength={10}
          value={dataVencimento}
          onChangeText={handleDateChange}
        />

        {/* Seletor de Status */}
        <Text style={styles.label}>STATUS</Text>
        <View style={styles.statusContainer}>
          <StatusButton label="PENDENTE" value="pendente" color="#e67e22" />
          <StatusButton label="PAGO" value="pago" color="#27ae60" />
          <StatusButton label="ATRASADO" value="atrasado" color="#c0392b" />
        </View>

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[styles.btnSalvar, loading && { opacity: 0.7 }]}
          onPress={handleSalvar}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>
              {idEdicao ? "SALVAR ALTERAÇÕES" : "AGENDAR PAGAMENTO"}
            </Text>
          )}
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
    paddingBottom: 50, // Espaço extra no final
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#747d8c",
    marginBottom: 8,
    marginTop: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#f1f2f6",
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
    color: "#2d3436",
    borderWidth: 1,
    borderColor: "transparent",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dfe6e9",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  statusBtnText: {
    fontWeight: "bold",
    fontSize: 12,
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
