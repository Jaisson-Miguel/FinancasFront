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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome } from "@expo/vector-icons"; // Importando ícones para a setinha
import Header from "./../../components/Header";

export default function MovimentacaoOffline({ route, navigation }) {
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState("entrada");
  const [loading, setLoading] = useState(false);

  // Estados para seleção de caixa
  const [listaCaixas, setListaCaixas] = useState([]);
  const [caixaSelecionada, setCaixaSelecionada] = useState(null);
  const [loadingCaixas, setLoadingCaixas] = useState(true);

  // Estado para controlar se o dropdown está aberto ou fechado
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    const carregarCaixasOffline = async () => {
      try {
        const jsonCaixas = await AsyncStorage.getItem("@financas:caixas_lista");
        if (jsonCaixas) {
          const caixas = JSON.parse(jsonCaixas);
          setListaCaixas(caixas);

          const principal = caixas.find(
            (c) => c.nome.toLowerCase() === "principal"
          );
          setCaixaSelecionada(principal || caixas[0]);
        } else {
          Alert.alert("Aviso", "Nenhuma lista de caixas encontrada offline.");
        }
      } catch (error) {
        console.log("Erro ao carregar caixas offline:", error);
      } finally {
        setLoadingCaixas(false);
      }
    };
    carregarCaixasOffline();
  }, []);

  const handleSalvarOffline = async () => {
    if (!valor || !descricao) {
      Alert.alert("Erro", "Preencha o valor e a descrição!");
      return;
    }
    if (!caixaSelecionada) {
      Alert.alert("Erro", "Selecione uma caixa!");
      return;
    }

    setLoading(true);
    try {
      let valorFormatado = parseFloat(valor.replace(",", "."));
      if (isNaN(valorFormatado)) {
        Alert.alert("Erro", "Valor inválido.");
        setLoading(false);
        return;
      }
      if (tipo === "saida") {
        valorFormatado = valorFormatado * -1;
      }

      const novaMovimentacao = {
        id: Date.now().toString(),
        descricao,
        valor: valorFormatado,
        data: new Date().toISOString(),
        tipo,
        sincronizado: false,
        caixaId: caixaSelecionada._id,
        caixaNome: caixaSelecionada.nome,
      };

      const jsonExistente = await AsyncStorage.getItem(
        "@financas:movimentacoes_offline"
      );
      let listaAtual = jsonExistente ? JSON.parse(jsonExistente) : [];
      listaAtual.push(novaMovimentacao);

      await AsyncStorage.setItem(
        "@financas:movimentacoes_offline",
        JSON.stringify(listaAtual)
      );

      Alert.alert(
        "Salvo no Celular!",
        `Movimentação registrada na caixa "${caixaSelecionada.nome}".`
      );
      navigation.goBack();
    } catch (error) {
      console.log("Erro ao salvar offline:", error);
      Alert.alert("Erro", "Falha ao salvar no dispositivo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerOffline}>
        <Header title="Movimentação Offline" />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.avisoContainer}>
          <Text style={styles.avisoText}>
            MODO SEM INTERNET: Os dados serão salvos no celular.
          </Text>
        </View>

        {/* --- SELETOR DE CAIXA (DROPDOWN) --- */}
        <Text style={styles.label}>SELECIONE A CAIXA</Text>

        {loadingCaixas ? (
          <ActivityIndicator color="#636e72" />
        ) : (
          <View style={styles.dropdownContainer}>
            {/* Cabeçalho do Dropdown (O que aparece sempre) */}
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setExpandido(!expandido)}
              activeOpacity={0.7}
            >
              <Text style={styles.dropdownHeaderText}>
                {caixaSelecionada ? caixaSelecionada.nome : "Selecione..."}
              </Text>
              <FontAwesome
                name={expandido ? "chevron-up" : "chevron-down"}
                size={16}
                color="#636e72"
              />
            </TouchableOpacity>

            {/* Lista de Opções (Aparece só se expandido for true) */}
            {expandido && (
              <View style={styles.dropdownBody}>
                {listaCaixas.map((item) => (
                  <TouchableOpacity
                    key={item._id}
                    style={[
                      styles.dropdownItem,
                      caixaSelecionada?._id === item._id &&
                        styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setCaixaSelecionada(item);
                      setExpandido(false); // Fecha após selecionar
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        caixaSelecionada?._id === item._id &&
                          styles.dropdownItemTextSelected,
                      ]}
                    >
                      {item.nome}
                    </Text>
                    {caixaSelecionada?._id === item._id && (
                      <FontAwesome name="check" size={14} color="#2d3436" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* SELETOR DE TIPO */}
        <Text style={styles.label}>TIPO DE MOVIMENTAÇÃO</Text>
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

        {/* Descrição */}
        <Text style={styles.label}>DESCRIÇÃO</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: "top" }]}
          placeholder="Ex: Compra no mercado (sem sinal)"
          placeholderTextColor="#a4b0be"
          multiline={true}
          value={descricao}
          onChangeText={setDescricao}
        />

        {/* Botão Salvar */}
        <TouchableOpacity
          style={[styles.btnSalvar, loading && { opacity: 0.7 }]}
          onPress={handleSalvarOffline}
          disabled={loading}
        >
          <Text style={styles.btnText}>
            {loading ? "SALVANDO..." : "SALVAR NO CELULAR"}
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
  headerOffline: {
    backgroundColor: "#636e72",
  },
  content: {
    padding: 24,
    paddingBottom: 50,
  },
  avisoContainer: {
    backgroundColor: "#ffeaa7",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#fdcb6e",
  },
  avisoText: {
    color: "#d35400",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
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

  // --- ESTILOS DO DROPDOWN ---
  dropdownContainer: {
    marginBottom: 5,
  },
  dropdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f1f2f6",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dfe6e9",
  },
  dropdownHeaderText: {
    fontSize: 16,
    color: "#2d3436",
    fontWeight: "600",
  },
  dropdownBody: {
    marginTop: 5,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dfe6e9",
    elevation: 3, // Sombra no Android
    shadowColor: "#000", // Sombra no iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: "hidden",
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f2f6",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownItemSelected: {
    backgroundColor: "#dfe6e9",
  },
  dropdownItemText: {
    fontSize: 16,
    color: "#636e72",
  },
  dropdownItemTextSelected: {
    color: "#2d3436",
    fontWeight: "bold",
  },
  // ---------------------------

  typeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 15,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: "#f1f2f6",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  typeButtonEntradaActive: {
    backgroundColor: "#00b894",
  },
  typeButtonSaidaActive: {
    backgroundColor: "#d63031",
  },
  typeText: {
    fontWeight: "bold",
    color: "#b2bec3",
    letterSpacing: 1,
  },
  typeTextActive: {
    color: "#fff",
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
  btnSalvar: {
    backgroundColor: "#636e72",
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
