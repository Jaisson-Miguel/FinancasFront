import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { FontAwesome } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Header from "./../../components/Header";

export default function Contador({ route, navigation }) {
  // Recebe o saldo do sistema (Caixa Principal)
  const { saldo } = route.params || { saldo: 0 };

  // --- ESTADOS ---
  const [quantidades, setQuantidades] = useState({
    200: "",
    100: "",
    50: "",
    20: "",
    10: "",
    5: "",
    2: "",
  });
  const [totalMoedas, setTotalMoedas] = useState("");
  const [valorOnline, setValorOnline] = useState(""); // Novo estado para valor online

  // Totais calculados
  const [totalFisico, setTotalFisico] = useState(0);
  const [totalOnlineCalculado, setTotalOnlineCalculado] = useState(0);
  const [totalApurado, setTotalApurado] = useState(0); // Soma de Físico + Online

  const cedulas = [200, 100, 50, 20, 10, 5, 2];

  // --- CARREGAR DADOS ---
  useEffect(() => {
    carregarDadosSalvos();
  }, []);

  const carregarDadosSalvos = async () => {
    try {
      const jsonValue = await AsyncStorage.getItem("@contador_dinheiro");
      if (jsonValue != null) {
        const dados = JSON.parse(jsonValue);
        if (dados.quantidades) setQuantidades(dados.quantidades);
        if (dados.totalMoedas) setTotalMoedas(dados.totalMoedas);
        if (dados.valorOnline) setValorOnline(dados.valorOnline);
      }
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    }
  };

  // --- SALVAR DADOS ---
  const salvarDados = async () => {
    try {
      const dadosParaSalvar = { quantidades, totalMoedas, valorOnline };
      await AsyncStorage.setItem(
        "@contador_dinheiro",
        JSON.stringify(dadosParaSalvar)
      );
      Alert.alert("Sucesso", "Contagem salva com sucesso!");
    } catch (e) {
      Alert.alert("Erro", "Não foi possível salvar.");
    }
  };

  // --- CÁLCULOS ---
  useEffect(() => {
    calcularTotal();
  }, [quantidades, totalMoedas, valorOnline]);

  const calcularTotal = () => {
    let somaNotas = 0;

    // 1. Calcula Notas
    cedulas.forEach((valor) => {
      const qtd = parseInt(quantidades[valor]) || 0;
      somaNotas += qtd * valor;
    });

    // 2. Calcula Moedas
    const vMoedas = parseFloat(totalMoedas.replace(",", ".")) || 0;

    // Total Físico (Notas + Moedas)
    const fisico = somaNotas + vMoedas;
    setTotalFisico(fisico);

    // 3. Calcula Online
    const vOnline = parseFloat(valorOnline.replace(",", ".")) || 0;
    setTotalOnlineCalculado(vOnline);

    // 4. Total Apurado (Físico + Online)
    setTotalApurado(fisico + vOnline);
  };

  // --- HANDLERS ---
  const handleChangeQtd = (valorNota, texto) => {
    const novoTexto = texto.replace(/[^0-9]/g, "");
    setQuantidades((prev) => ({ ...prev, [valorNota]: novoTexto }));
  };

  const handleChangeMoedas = (texto) => {
    const novoTexto = texto.replace(/[^0-9.,]/g, "");
    setTotalMoedas(novoTexto);
  };

  const handleChangeOnline = (texto) => {
    const novoTexto = texto.replace(/[^0-9.,]/g, "");
    setValorOnline(novoTexto);
  };

  const limparTudo = () => {
    setQuantidades({ 200: "", 100: "", 50: "", 20: "", 10: "", 5: "", 2: "" });
    setTotalMoedas("");
    setValorOnline("");
  };

  // Cálculo da Diferença: Total Apurado - Saldo Sistema
  // Se positivo: Sobra. Se negativo: Falta.
  const diferenca = totalApurado - saldo;
  const isNegativo = diferenca < 0;

  return (
    <View style={styles.container}>
      <Header
        title="Conferência de Caixa"
        showBack={true}
        navigation={navigation}
      />

      {/* --- CARD DE RESUMO GERAL --- */}
      <View style={styles.topCard}>
        {/* Linha 1: Saldo Sistema */}
        <View style={styles.rowResumo}>
          <Text style={styles.labelResumo}>Saldo no Sistema (Principal):</Text>
          <Text style={styles.valorResumo}>
            R$ {saldo.toFixed(2).replace(".", ",")}
          </Text>
        </View>

        {/* Linha 2: Total Físico */}
        <View style={styles.rowResumo}>
          <Text style={styles.labelResumo}>
            (+) Total Físico (Notas+Moedas):
          </Text>
          <Text style={styles.valorResumo}>
            R$ {totalFisico.toFixed(2).replace(".", ",")}
          </Text>
        </View>

        {/* Linha 3: Total Online */}
        <View style={styles.rowResumo}>
          <Text style={styles.labelResumo}>(+) Total Online:</Text>
          <Text style={styles.valorResumo}>
            R$ {totalOnlineCalculado.toFixed(2).replace(".", ",")}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Linha 4: Total Apurado */}
        <View style={styles.rowResumo}>
          <Text
            style={[
              styles.labelResumo,
              { fontWeight: "bold", color: "#2d3436" },
            ]}
          >
            (=) Total Apurado:
          </Text>
          <Text style={[styles.valorResumo, { color: "#2d3436" }]}>
            R$ {totalApurado.toFixed(2).replace(".", ",")}
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Linha 5: Diferença */}
        <View style={{ alignItems: "center", marginTop: 5 }}>
          <Text style={styles.labelDiferenca}>DIFERENÇA (Quebra)</Text>
          <Text
            style={[
              styles.valorDiferenca,
              { color: isNegativo ? "#d63031" : "#00b894" },
            ]}
          >
            R$ {diferenca.toFixed(2).replace(".", ",")}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* --- BOTÕES DE AÇÃO --- */}
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={styles.btnSalvar} onPress={salvarDados}>
            <FontAwesome name="save" size={16} color="#fff" />
            <Text style={styles.btnSalvarText}>Salvar Contagem</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnClear} onPress={limparTudo}>
            <FontAwesome name="trash" size={16} color="#d63031" />
            <Text style={styles.btnClearText}>Limpar</Text>
          </TouchableOpacity>
        </View>

        {/* --- INPUT VALOR ONLINE --- */}
        <View style={[styles.rowCedula, styles.rowOnline]}>
          <View style={styles.labelContainerOnline}>
            <FontAwesome
              name="globe"
              size={20}
              color="#0984e3"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.valorNotaOnline}>Valor Online</Text>
          </View>
          <View style={styles.inputContainerMoeda}>
            <Text style={styles.moedaPrefix}>R$</Text>
            <TextInput
              style={[
                styles.inputMoeda,
                { borderColor: "#0984e3", color: "#0984e3" },
              ]}
              keyboardType="numeric"
              placeholder="0,00"
              value={valorOnline}
              onChangeText={handleChangeOnline}
            />
          </View>
        </View>

        {/* --- INPUT MOEDAS --- */}
        <View style={[styles.rowCedula, styles.rowMoedas]}>
          <View style={styles.labelContainer}>
            <Text style={styles.valorNotaMoeda}>Moedas</Text>
          </View>
          <View style={styles.inputContainerMoeda}>
            <Text style={styles.moedaPrefix}>R$</Text>
            <TextInput
              style={styles.inputMoeda}
              keyboardType="numeric"
              placeholder="0,00"
              value={totalMoedas}
              onChangeText={handleChangeMoedas}
            />
          </View>
        </View>

        {/* --- INPUTS CÉDULAS --- */}
        {cedulas.map((valor) => (
          <View key={valor} style={styles.rowCedula}>
            <View style={styles.labelContainer}>
              <Text style={styles.simbolo}>R$</Text>
              <Text style={styles.valorNota}>{valor}</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.xText}>x</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                maxLength={4}
                value={quantidades[valor]}
                onChangeText={(text) => handleChangeQtd(valor, text)}
              />
            </View>

            <View style={styles.subtotalContainer}>
              <Text style={styles.subtotalLabel}>Subtotal</Text>
              <Text style={styles.subtotalValor}>
                R${" "}
                {((parseInt(quantidades[valor]) || 0) * valor)
                  .toFixed(2)
                  .replace(".", ",")}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
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
    paddingBottom: 40,
  },
  // --- CARD TOPO ---
  topCard: {
    backgroundColor: "#fff",
    margin: 20,
    marginBottom: 5,
    padding: 15,
    borderRadius: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rowResumo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  labelResumo: {
    fontSize: 14,
    color: "#636e72",
  },
  valorResumo: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2d3436",
  },
  divider: {
    height: 1,
    backgroundColor: "#dfe6e9",
    marginVertical: 8,
  },
  labelDiferenca: {
    fontSize: 12,
    color: "#636e72",
    fontWeight: "bold",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  valorDiferenca: {
    fontSize: 24,
    fontWeight: "bold",
  },
  // --- BOTÕES ---
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  btnSalvar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#00b894",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    elevation: 2,
  },
  btnSalvarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  btnClear: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fab1a0",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  btnClearText: {
    color: "#d63031",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },
  // --- LISTA ---
  rowCedula: {
    flexDirection: "row",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "space-between",
    elevation: 2,
  },
  rowMoedas: {
    backgroundColor: "#dfe6e9",
    borderWidth: 1,
    borderColor: "#b2bec3",
  },
  rowOnline: {
    backgroundColor: "#e1f5fe", // Azulzinho claro para destacar
    borderWidth: 1,
    borderColor: "#81ecec",
  },
  labelContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    width: 90,
  },
  labelContainerOnline: {
    flexDirection: "row",
    alignItems: "center",
    width: 130,
  },
  simbolo: {
    fontSize: 14,
    color: "#b2bec3",
    marginRight: 2,
  },
  valorNota: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2d3436",
  },
  valorNotaMoeda: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3436",
  },
  valorNotaOnline: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0984e3",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  inputContainerMoeda: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
    paddingRight: 10,
  },
  xText: {
    fontSize: 16,
    color: "#b2bec3",
    marginRight: 10,
  },
  moedaPrefix: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3436",
    marginRight: 5,
  },
  input: {
    backgroundColor: "#f1f2f6",
    width: 80,
    height: 45,
    borderRadius: 8,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3436",
    borderWidth: 1,
    borderColor: "#dfe6e9",
  },
  inputMoeda: {
    backgroundColor: "#fff",
    width: 120,
    height: 45,
    borderRadius: 8,
    textAlign: "right",
    paddingRight: 10,
    fontSize: 18,
    fontWeight: "bold",
    color: "#2d3436",
    borderWidth: 1,
    borderColor: "#b2bec3",
  },
  subtotalContainer: {
    width: 100,
    alignItems: "flex-end",
  },
  subtotalLabel: {
    fontSize: 12,
    color: "#b2bec3",
  },
  subtotalValor: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00b894",
  },
});
