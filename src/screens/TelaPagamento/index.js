import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import Header from "./../../components/Header";
import API_URL from "./../../config";

export default function TelaPagamento({ navigation, route }) {
  const { conta } = route.params;

  const [listaCaixas, setListaCaixas] = useState([]);
  const [loadingCaixas, setLoadingCaixas] = useState(true);
  const [loadingPagamento, setLoadingPagamento] = useState(false);

  // Estado para armazenar os valores digitados por caixa
  // Exemplo: { "ID_DO_CAIXA_1": "50,00", "ID_DO_CAIXA_2": "20,00" }
  const [valoresPorCaixa, setValoresPorCaixa] = useState({});

  // Calcula o valor restante real (se não tiver, usa o total)
  const valorRestanteReal =
    conta.valorRestante !== undefined ? conta.valorRestante : conta.valor;

  // Carrega os caixas disponíveis
  useFocusEffect(
    useCallback(() => {
      const carregarCaixas = async () => {
        try {
          const response = await fetch(`${API_URL}/caixas`);
          const data = await response.json();
          setListaCaixas(data);
        } catch (error) {
          console.log("Erro ao carregar caixas:", error);
        } finally {
          setLoadingCaixas(false);
        }
      };
      carregarCaixas();
    }, [])
  );

  // Calcula o total que o usuário já digitou/selecionou
  const totalAlocado = useMemo(() => {
    let total = 0;
    Object.values(valoresPorCaixa).forEach((val) => {
      const num = parseFloat(val.replace(",", "."));
      if (!isNaN(num)) total += num;
    });
    return total;
  }, [valoresPorCaixa]);

  // Função para marcar/desmarcar um caixa
  const toggleCaixa = (caixaId) => {
    setValoresPorCaixa((prev) => {
      const novo = { ...prev };
      if (novo[caixaId] !== undefined) {
        // Se já existe, remove (desmarca)
        delete novo[caixaId];
      } else {
        // Se não existe, adiciona com valor vazio ou 0
        novo[caixaId] = "";
      }
      return novo;
    });
  };

  // Função para atualizar o valor de um caixa específico
  const onChangeValorCaixa = (caixaId, text) => {
    // Permite apenas números e vírgula/ponto
    const limpo = text.replace(/[^0-9.,]/g, "");
    setValoresPorCaixa((prev) => ({
      ...prev,
      [caixaId]: limpo,
    }));
  };

  const handleConfirmarPagamento = async () => {
    // 1. Prepara o array para enviar ao backend
    const pagamentosParaEnviar = [];
    let somaValidacao = 0;

    Object.keys(valoresPorCaixa).forEach((caixaId) => {
      const valorStr = valoresPorCaixa[caixaId];
      const valorFloat = parseFloat(valorStr.replace(",", "."));

      if (!isNaN(valorFloat) && valorFloat > 0) {
        pagamentosParaEnviar.push({
          caixaId: caixaId,
          valor: valorFloat,
        });
        somaValidacao += valorFloat;
      }
    });

    // 2. Validações
    if (pagamentosParaEnviar.length === 0) {
      Alert.alert(
        "Atenção",
        "Selecione pelo menos um caixa e informe um valor."
      );
      return;
    }

    // Margem de erro pequena (0.05) para evitar problemas de arredondamento
    if (somaValidacao > valorRestanteReal + 0.05) {
      Alert.alert(
        "Erro",
        `A soma (R$ ${somaValidacao.toFixed(
          2
        )}) ultrapassa o valor restante da conta.`
      );
      return;
    }

    setLoadingPagamento(true);

    try {
      const response = await fetch(`${API_URL}/contas/${conta._id}/pagar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagamentos: pagamentosParaEnviar, // Envia o array
          dataPagamento: new Date(),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert("Sucesso", "Pagamentos registrados!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert("Erro", data.error || "Falha ao registrar pagamento.");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha na conexão com o servidor.");
    } finally {
      setLoadingPagamento(false);
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Registrar Pagamento" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content}>
          {/* Resumo da Conta */}
          <View style={styles.cardResumo}>
            <Text style={styles.labelResumo}>PAGANDO CONTA DE:</Text>
            <Text style={styles.valorResumo}>{conta.descricao}</Text>
            <Text style={styles.descResumo}>{conta.instituicao}</Text>
            <Text style={styles.descResumo}>{conta.observacao}</Text>

            <View style={styles.divisor} />

            <View style={styles.rowValores}>
              <View>
                <Text style={styles.labelSmall}>RESTANTE A PAGAR</Text>
                <Text style={styles.valorRestante}>
                  R$ {valorRestanteReal.toFixed(2).replace(".", ",")}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={styles.labelSmall}>TOTAL SELECIONADO</Text>
                <Text
                  style={[
                    styles.valorAlocado,
                    totalAlocado > valorRestanteReal + 0.01
                      ? { color: "#c0392b" } // Vermelho se passar
                      : { color: "#27ae60" }, // Verde se ok
                  ]}
                >
                  R$ {totalAlocado.toFixed(2).replace(".", ",")}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.sectionTitle}>
            SELECIONE OS CAIXAS E VALORES:
          </Text>

          {loadingCaixas ? (
            <ActivityIndicator color="#2d3436" />
          ) : (
            <View style={styles.listaCaixas}>
              {listaCaixas.map((caixa) => {
                const isSelected = valoresPorCaixa[caixa._id] !== undefined;
                return (
                  <View
                    key={caixa._id}
                    style={[
                      styles.cardCaixa,
                      isSelected && styles.cardCaixaAtivo,
                    ]}
                  >
                    {/* Cabeçalho do Card (Nome e Checkbox) */}
                    <TouchableOpacity
                      style={styles.headerCaixa}
                      onPress={() => toggleCaixa(caixa._id)}
                    >
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <FontAwesome
                          name={isSelected ? "check-square" : "square-o"}
                          size={24}
                          color={isSelected ? "#2d3436" : "#b2bec3"}
                        />
                        <View style={{ marginLeft: 10 }}>
                          <Text style={styles.nomeCaixa}>{caixa.nome}</Text>
                          <Text style={styles.saldoCaixa}>
                            Saldo: R$ {caixa.saldo.toFixed(2).replace(".", ",")}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Input de Valor (Só aparece se selecionado) */}
                    {isSelected && (
                      <View style={styles.inputContainer}>
                        <Text style={styles.prefixoInput}>R$</Text>
                        <TextInput
                          style={styles.inputValor}
                          keyboardType="numeric"
                          placeholder="0,00"
                          value={valoresPorCaixa[caixa._id]}
                          onChangeText={(text) =>
                            onChangeValorCaixa(caixa._id, text)
                          }
                        />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {/* Botão Confirmar */}
          <TouchableOpacity
            style={[styles.btnConfirmar, loadingPagamento && { opacity: 0.7 }]}
            onPress={handleConfirmarPagamento}
            disabled={loadingPagamento}
          >
            {loadingPagamento ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.txtConfirmar}>CONFIRMAR PAGAMENTO</Text>
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
    backgroundColor: "#f5f6fa",
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  cardResumo: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  labelResumo: {
    fontSize: 12,
    color: "#b2bec3",
    fontWeight: "bold",
    marginBottom: 5,
  },
  valorResumo: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3436",
  },
  descResumo: {
    fontSize: 14,
    color: "#636e72",
    marginBottom: 10,
  },
  divisor: {
    height: 1,
    width: "100%",
    backgroundColor: "#f1f2f6",
    marginVertical: 15,
  },
  rowValores: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  labelSmall: {
    fontSize: 10,
    color: "#b2bec3",
    fontWeight: "bold",
    marginBottom: 2,
  },
  valorRestante: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#c0392b",
  },
  valorAlocado: {
    fontSize: 22,
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2d3436",
    marginBottom: 15,
    marginTop: 10,
  },
  listaCaixas: {
    gap: 10,
    marginBottom: 30,
  },
  cardCaixa: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: "#dfe6e9",
  },
  cardCaixaAtivo: {
    borderColor: "#2d3436",
    backgroundColor: "#fff",
    borderLeftWidth: 5,
    borderLeftColor: "#2d3436",
  },
  headerCaixa: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nomeCaixa: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2d3436",
  },
  saldoCaixa: {
    fontSize: 12,
    color: "#636e72",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f2f6",
    borderRadius: 8,
    marginTop: 15,
    paddingHorizontal: 10,
  },
  prefixoInput: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#636e72",
    marginRight: 5,
  },
  inputValor: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3436",
  },
  btnConfirmar: {
    backgroundColor: "#2d3436",
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: "center",
    elevation: 3,
  },
  txtConfirmar: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});
