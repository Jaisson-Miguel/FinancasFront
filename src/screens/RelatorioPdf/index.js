import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import Header from "./../../components/Header";
import API_URL from "./../../config"; // Certifique-se de que API_URL está configurado corretamente

export default function RelatorioPdf({ navigation }) {
  const [loadingPdf, setLoadingPdf] = useState(false); // Estado para o botão de PDF
  const [loadingReset, setLoadingReset] = useState(false); // Novo estado para o botão de Reset Principal

  const handleGenerateReport = async () => {
    setLoadingPdf(true); // Ativa o loading para o PDF
    try {
      const fileName = `relatorio_financeiro_${Date.now()}.pdf`;
      const fileUri = FileSystem.cacheDirectory + fileName;
      const response = await fetch(`${API_URL}/relatorio-pdf`, {
        method: "GET",
        headers: {
          Accept: "application/pdf",
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Erro ao baixar PDF: ${response.status} - ${errorText}`
        );
      }
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64data = reader.result.split(",")[1];
        await FileSystem.writeAsStringAsync(fileUri, base64data, {
          encoding: "base64",
        });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "application/pdf",
            UTI: "com.adobe.pdf",
            dialogTitle: "Compartilhar Relatório Financeiro",
          });
        } else {
          Alert.alert("Sucesso", `Relatório salvo em: ${fileUri}`);
        }
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Frontend: Erro ao baixar ou compartilhar o PDF:", error);
      Alert.alert(
        "Erro",
        `Não foi possível gerar o relatório: ${error.message}`
      );
    } finally {
      setLoadingPdf(false); // Desativa o loading do PDF
    }
  };

  // FUNÇÃO ATUALIZADA: Lida com a verificação e, após confirmação, a criação das movimentações
  const handleResetPrincipal = async () => {
    setLoadingReset(true); // Ativa o loading para o botão de Reset Principal
    try {
      // 1. Chamar a rota de VERIFICAÇÃO de integridade
      const response = await fetch(
        `${API_URL}/principal/verificar-integridade`,
        {
          method: "GET", // Método GET para apenas verificar
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json(); // Pega a resposta JSON do backend

      if (!response.ok) {
        // Se a resposta não for OK (ex: 404, 409, 500) ou statusIntegridade for "incongruente"
        Alert.alert("Alerta de Integridade", data.message, [
          { text: "OK", style: "cancel" },
          {
            text: "Detalhes",
            onPress: () =>
              Alert.alert(
                "Detalhes da Inconsistência",
                `Saldo Registrado: ${
                  data.saldoRegistrado || "N/A"
                }\nSoma Movimentações: ${
                  data.somaMovimentacoes || "N/A"
                }\nDiferença: ${data.diferenca || "N/A"}`
              ),
          },
        ]);
        console.error(
          "Erro ou inconsistência na verificação de integridade:",
          data
        );
      } else if (data.statusIntegridade === "congruente") {
        // Se a verificação foi um sucesso e os saldos são congruentes
        Alert.alert(
          "Confirmação de Ajuste",
          `A integridade do Caixa Principal foi verificada e está consistente.\n\nSaldo Registrado: R$ ${parseFloat(
            data.saldoRegistrado
          ).toFixed(2)}\nSoma Movimentações: R$ ${parseFloat(
            data.somaMovimentacoes
          ).toFixed(
            2
          )}\n\nDeseja criar as movimentações de ajuste ("Saldo" e "Total Empréstimos") agora?`,
          [
            {
              text: "Não",
              style: "cancel",
              onPress: () =>
                console.log("Criação de movimentações cancelada pelo usuário."),
            },
            {
              text: "Sim",
              onPress: async () => {
                // 2. Se o usuário confirmar, fazer uma NOVA requisição para CRIAR as movimentações
                try {
                  const createResponse = await fetch(
                    `${API_URL}/principal/criar-movimentacoes-ajuste`,
                    {
                      method: "POST", // Método POST para criar recursos
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify({
                        caixaPrincipalId: data.caixaPrincipalId, // Envia o ID do caixa principal
                        saldoRegistrado: data.saldoRegistrado, // Envia o saldo registrado para a criação da movimentação "Saldo"
                      }),
                    }
                  );

                  const createData = await createResponse.json(); // Pega a resposta JSON da criação

                  if (createResponse.ok) {
                    Alert.alert("Sucesso", createData.message);
                    console.log(
                      "Movimentações de ajuste criadas com sucesso:",
                      createData
                    );
                  } else {
                    Alert.alert(
                      "Erro ao Criar Movimentações",
                      createData.message
                    );
                    console.error("Erro ao criar movimentações:", createData);
                  }
                } catch (createError) {
                  console.error(
                    "Frontend: Erro ao enviar requisição para criar movimentações:",
                    createError
                  );
                  Alert.alert(
                    "Erro de Conexão",
                    `Não foi possível criar as movimentações: ${createError.message}`
                  );
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error(
        "Frontend: Erro ao verificar/resetar o Caixa Principal:",
        error
      );
      Alert.alert(
        "Erro de Conexão",
        `Não foi possível conectar ao servidor para verificar o Caixa Principal: ${error.message}`
      );
    } finally {
      setLoadingReset(false); // Desativa o loading do botão de Reset Principal
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Relatórios e Ferramentas" // Título mais abrangente
        showBack={true}
        navigation={navigation}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.infoText}>
          Gere um relatório PDF detalhado de todas as movimentações financeiras
          do sistema. O relatório incluirá agrupamentos por caixa e, para o
          Caixa Principal, por categoria.
        </Text>
        <TouchableOpacity
          style={[styles.btnGerarRelatorio, loadingPdf && { opacity: 0.7 }]}
          onPress={handleGenerateReport}
          disabled={loadingPdf}
        >
          {loadingPdf ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>GERAR RELATÓRIO PDF</Text>
          )}
        </TouchableOpacity>

        {/* NOVO BOTÃO PARA VERIFICAÇÃO E CRIAÇÃO DE AJUSTES DO CAIXA PRINCIPAL */}
        <Text style={styles.infoText_reset}>
          Verifique a integridade do saldo do Caixa Principal, comparando-o com
          a soma total de todas as movimentações. Se consistente, você poderá
          confirmar a criação de movimentações de ajuste.
        </Text>
        <TouchableOpacity
          style={[styles.btnResetPrincipal, loadingReset && { opacity: 0.7 }]}
          onPress={handleResetPrincipal}
          disabled={loadingReset}
        >
          {loadingReset ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>VERIFICAR CAIXA PRINCIPAL</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimerText}>
          Certifique-se de que seu backend está em execução e acessível.
        </Text>
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
    paddingBottom: 50,
    alignItems: "center",
  },
  infoText: {
    fontSize: 14,
    color: "#636e72",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
  },
  infoText_reset: {
    fontSize: 14,
    color: "#636e72",
    textAlign: "center",
    marginTop: 40,
    marginBottom: 20,
    lineHeight: 22,
  },
  btnGerarRelatorio: {
    backgroundColor: "#2d3436",
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
    elevation: 5,
    width: "100%",
    maxWidth: 300,
  },
  btnResetPrincipal: {
    backgroundColor: "#0984e3",
    paddingVertical: 18,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginTop: 20,
    alignItems: "center",
    elevation: 5,
    width: "100%",
    maxWidth: 300,
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  disclaimerText: {
    marginTop: 40,
    fontSize: 12,
    color: "#b2bec3",
    textAlign: "center",
  },
});
