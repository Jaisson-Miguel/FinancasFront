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
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Header from "./../../components/Header";
import API_URL from "./../../config";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function AgendarPagamento({ route, navigation }) {
  // Recebe a conta para edição, se houver.
  // Usamos um valor padrão vazio para evitar erros se 'route.params' for undefined.
  const { contaParaEditar } = route.params || {};

  const [idEdicao, setIdEdicao] = useState(null);
  const [instituicao, setInstituicao] = useState("");
  const [descricao, setDescricao] = useState("");
  const [observacao, setObservacao] = useState("");
  const [valor, setValor] = useState("");
  const [dataVencimento, setDataVencimento] = useState(new Date()); // Inicializa com a data atual
  const [status, setStatus] = useState("pendente");
  const [loading, setLoading] = useState(false);

  // Estados para o DateTimePicker
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Função para limpar os campos do formulário
  const limparCampos = useCallback(() => {
    setIdEdicao(null);
    setInstituicao("");
    setDescricao("");
    setObservacao("");
    setValor("");
    setDataVencimento(new Date()); // Reseta para a data atual
    setStatus("pendente");
    setShowDatePicker(false);
  }, []);

  // Efeito para carregar dados da conta quando a tela foca (para edição)
  useFocusEffect(
    useCallback(() => {
      if (contaParaEditar) {
        // MODO EDIÇÃO
        setIdEdicao(contaParaEditar._id);
        setInstituicao(contaParaEditar.instituicao || "");
        setDescricao(contaParaEditar.descricao || "");
        setObservacao(contaParaEditar.observacao || "");
        // Garante que o valor seja uma string formatada para o TextInput
        setValor(
          contaParaEditar.valor
            ? contaParaEditar.valor.toString().replace(".", ",")
            : ""
        );
        setStatus(contaParaEditar.status || "pendente");

        // Carrega a data de vencimento
        if (contaParaEditar.dataVencimento) {
          // Certifica-se de que é um objeto Date válido
          const dataObj = new Date(contaParaEditar.dataVencimento);
          if (!isNaN(dataObj.getTime())) {
            setDataVencimento(dataObj);
          } else {
            console.warn(
              "Data de vencimento inválida recebida:",
              contaParaEditar.dataVencimento
            );
            setDataVencimento(new Date()); // Fallback para data atual
          }
        } else {
          setDataVencimento(new Date()); // Fallback para data atual
        }
      } else {
        // MODO CRIAÇÃO - Limpa os campos
        limparCampos();
      }
      // Retorna uma função de limpeza para quando a tela desfocar
      return () => limparCampos();
    }, [contaParaEditar, limparCampos])
  );

  // Handler para mudança de data no DateTimePicker
  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || dataVencimento;
    setShowDatePicker(Platform.OS === "ios"); // Fecha o picker no Android, mantém no iOS
    setDataVencimento(currentDate);
  };

  // Handler para salvar/atualizar a conta
  const handleSalvar = async () => {
    if (!instituicao || !descricao || !valor || !dataVencimento) {
      Alert.alert("Erro", "Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setLoading(true);

    // Converte o valor de volta para número (usando ponto como separador decimal)
    const valorNumerico = parseFloat(valor.replace(",", "."));
    if (isNaN(valorNumerico)) {
      Alert.alert("Erro", "Valor inválido. Use apenas números.");
      setLoading(false);
      return;
    }

    const dadosConta = {
      instituicao,
      descricao,
      observacao: observacao || undefined, // Envia undefined se vazio
      valor: valorNumerico,
      dataVencimento: dataVencimento.toISOString(), // Envia em formato ISO
      status,
    };

    try {
      const url = idEdicao
        ? `${API_URL}/contas/${idEdicao}`
        : `${API_URL}/contas`;
      const method = idEdicao ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dadosConta),
      });

      if (response.ok) {
        Alert.alert(
          "Sucesso",
          `Conta ${idEdicao ? "atualizada" : "agendada"} com sucesso!`
        );
        navigation.goBack(); // Volta para a tela anterior (ContasAPagar)
      } else {
        const errorData = await response.json();
        Alert.alert(
          "Erro",
          errorData.message ||
            `Falha ao ${idEdicao ? "atualizar" : "agendar"} conta.`
        );
      }
    } catch (error) {
      console.error("Erro ao salvar conta:", error);
      Alert.alert(
        "Erro",
        "Não foi possível conectar ao servidor. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title={idEdicao ? "Editar Conta" : "Agendar Pagamento"} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Instituição */}
          <Text style={styles.label}>INSTITUIÇÃO</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Banco do Brasil"
            value={instituicao}
            onChangeText={setInstituicao}
            autoCapitalize="words"
          />

          {/* Descrição */}
          <Text style={styles.label}>DESCRIÇÃO</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Aluguel, Fatura Cartão"
            value={descricao}
            onChangeText={setDescricao}
            autoCapitalize="sentences"
          />

          {/* Valor */}
          <Text style={styles.label}>VALOR</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: 1500,50"
            value={valor}
            onChangeText={(text) =>
              setValor(text.replace(/[^0-9,]/g, "").replace(",", "."))
            } // Permite apenas números e vírgula, e substitui vírgula por ponto para o estado
            keyboardType="numeric"
          />

          {/* Data de Vencimento */}
          <Text style={styles.label}>DATA DE VENCIMENTO</Text>
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.datePickerButtonText}>
              {format(dataVencimento, "dd/MM/yyyy", { locale: ptBR })}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              testID="dateTimePicker"
              value={dataVencimento}
              mode="date"
              display="default"
              onChange={onChangeDate}
              locale="pt-BR"
            />
          )}

          {/* Status */}
          <Text style={styles.label}>STATUS</Text>
          <View style={styles.statusContainer}>
            <TouchableOpacity
              style={[
                styles.statusBtn,
                status === "pendente" && {
                  backgroundColor: "#ffeaa7",
                  borderColor: "#fdcb6e",
                },
              ]}
              onPress={() => setStatus("pendente")}
            >
              <Text
                style={[
                  styles.statusBtnText,
                  status === "pendente" && { color: "#d63031" },
                ]}
              >
                PENDENTE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.statusBtn,
                status === "pago" && {
                  backgroundColor: "#b2e7d5",
                  borderColor: "#00b894",
                },
              ]}
              onPress={() => setStatus("pago")}
            >
              <Text
                style={[
                  styles.statusBtnText,
                  status === "pago" && { color: "#00b894" },
                ]}
              >
                PAGO
              </Text>
            </TouchableOpacity>
          </View>

          {/* Observação */}
          <Text style={styles.label}>OBSERVAÇÃO</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: Parcela 1/2"
            value={observacao}
            onChangeText={setObservacao}
            autoCapitalize="sentences"
          />

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
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 50,
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
  datePickerButton: {
    backgroundColor: "#f1f2f6",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "flex-start",
  },
  datePickerButtonText: {
    fontSize: 18,
    color: "#2d3436",
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
