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
import API_URL from "./../../config";

export default function RelatorioPdf({ navigation }) {
  const [loading, setLoading] = useState(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const fileName = `relatorio_financeiro_${Date.now()}.pdf`;
      const fileUri = FileSystem.cacheDirectory + fileName;

      console.log(
        "Frontend: Iniciando requisição para:",
        `${API_URL}/relatorio-pdf`
      );

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

        console.log("Frontend: PDF salvo com sucesso em:", fileUri);

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: "application/pdf",
            UTI: "com.adobe.pdf",
            dialogTitle: "Compartilhar Relatório Financeiro",
          });
          console.log("Frontend: Compartilhamento iniciado.");
        } else {
          Alert.alert("Sucesso", `Relatório salvo em: ${fileUri}`);
          console.warn("Frontend: Compartilhamento não disponível.");
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
      setLoading(false);
      console.log("Frontend: Requisição finalizada.");
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Relatório Completo"
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
          style={[styles.btnGerarRelatorio, loading && { opacity: 0.7 }]}
          onPress={handleGenerateReport}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>GERAR RELATÓRIO PDF</Text>
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
