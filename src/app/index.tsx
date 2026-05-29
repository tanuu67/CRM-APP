import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // Yahan wahi logic aayegi jo aapke web code mein hai
    if (!username || !password) {
      Alert.alert("Error", "Please enter both fields.");
      return;
    }
    console.log("Authenticating:", username);
    // Yahan Firebase Auth ka call add karein
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginWrapper}>
        <View style={styles.logoArea}>
          {/* Aapki logo file ka path */}
          <Image source={require('../../assets/logon.png')} style={styles.logo} />
          <Text style={styles.title}>Staff CRM Portal</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput 
            style={styles.input} 
            placeholder="e.g. admin" 
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput 
            style={styles.input} 
            placeholder="••••••••" 
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity style={styles.btnLogin} onPress={handleLogin}>
          <Text style={styles.btnText}>Authenticate →</Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text style={styles.forgotLink}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center', alignItems: 'center' },
  loginWrapper: { backgroundColor: '#fff', width: '90%', maxWidth: 420, padding: 40, borderRadius: 24, elevation: 10, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 20 },
  logoArea: { alignItems: 'center', marginBottom: 30 },
  logo: { width: 150, height: 150, borderRadius: 12, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8 },
  input: { width: '100%', padding: 15, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', fontSize: 14 },
  btnLogin: { width: '100%', padding: 15, borderRadius: 12, backgroundColor: '#0f172a', alignItems: 'center', marginTop: 10 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  forgotLink: { textAlign: 'center', marginTop: 20, color: '#00a2ed', fontSize: 13, fontWeight: '700' }
});