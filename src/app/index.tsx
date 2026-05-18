import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  StyleSheet, Text,
  TextInput, TouchableOpacity,
  View
} from 'react-native';

// 🚀 NATIVE SAFE AREA CONTEXT (Warning Fixed)
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// 🚀 NATIVE NAVIGATION
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 🚀 CRASH-PROOF FIREBASE
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

const firebaseConfig = {
  apiKey: "AIzaSyC-Ito4dNRQ45IjIOWL63Hqk9sKzbvKe-M",
  authDomain: "cureandcare-crm.firebaseapp.com",
  databaseURL: "https://cureandcare-crm-default-rtdb.firebaseio.com",
  projectId: "cureandcare-crm"
};

if (!firebase.apps || firebase.apps.length === 0) {
  firebase.initializeApp(firebaseConfig);
}

const database = firebase.database();
const Stack = createNativeStackNavigator();

// ==========================================
// 1. BRAND PREMIUM LOGIN SCREEN (Website Look)
// ==========================================
const LoginScreen = ({ onLogin }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if(!username || !password) return Alert.alert("Required", "Please fill all fields.");
    const cleanUsername = username.trim().toLowerCase();

    // 🌐 Web Website Database Validation (Same Credentials Match)
    database.ref('users/' + cleanUsername).once('value').then((snap) => {
      if(snap.exists()) {
        const userData = snap.val();
        if(String(userData.password) === String(password).trim()) {
          onLogin({
            username: cleanUsername,
            name: userData.name || cleanUsername,
            role: userData.role || 'staff',
            profilePic: userData.profilePic || ''
          });
          database.ref('users/' + cleanUsername + '/status').set('🟢 Online');
        } else {
          Alert.alert("Denied", "Incorrect Password!");
        }
      } else {
        Alert.alert("Not Found", "This username is not registered.");
      }
    }).catch(err => Alert.alert("Error", err.message));
  };

  return (
    <SafeAreaView style={styles.loginContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FDFDFD" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.loginFlex}>
        
        <View style={styles.premiumCard}>
          {/* Logo Section */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoCirclePair}>
              <View style={[styles.logoCircle, { backgroundColor: '#00A3E0', marginRight: -6 }]} />
              <View style={[styles.logoCircle, { backgroundColor: '#0A2540', opacity: 0.8 }]} />
            </View>
            <Text style={styles.brandName}>CURE AND CARE</Text>
          </View>

          <Text style={styles.portalHeading}>Staff CRM Portal</Text>

          {/* Inputs */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Username</Text>
            <TextInput 
              style={styles.premiumInput} 
              placeholder="e.g. admin or staff username" 
              placeholderTextColor="#A0AEC0"
              value={username} 
              onChangeText={setUsername} 
              autoCapitalize="none" 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput 
              style={styles.premiumInput} 
              placeholder="••••••••" 
              placeholderTextColor="#A0AEC0"
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry 
            />
          </View>

          {/* Authenticate Button */}
          <TouchableOpacity style={styles.authenticateBtn} onPress={handleLogin}>
            <Text style={styles.authenticateBtnText}>Authenticate →</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotBtn}>
            <Text style={styles.forgotBtnText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ==========================================
// 2. MAIN CHAT LIST SCREEN
// ==========================================
const ChatListScreen = ({ navigation, activeUser, onLogout }: any) => {
  const [myStatus, setMyStatus] = useState('🟢 Online');
  const [contacts, setContacts] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [globalUsers, setGlobalUsers] = useState<any[]>([]);

  useEffect(() => {
    database.ref('users/' + activeUser.username + '/status').on('value', snap => {
      if(snap.exists()) setMyStatus(snap.val());
    });

    const reqRef = database.ref('requests/' + activeUser.username);
    reqRef.on('value', snap => {
      const reqList: any[] = [];
      if(snap.exists()) snap.forEach(child => { reqList.push({ uid: child.key, ...child.val() }); });
      setRequests(reqList);
    });

    const contactsRef = database.ref('contacts/' + activeUser.username);
    contactsRef.on('value', snap => {
      const activeContacts: any[] = [{ id: 'group_general', name: 'General Team Chat', type: 'group' }];
      if(snap.exists()) {
        const myFriends = snap.val();
        Object.keys(myFriends).forEach(fUsername => {
          database.ref('users/' + fUsername).once('value').then(uSnap => {
            if(uSnap.exists()) {
              const uData = uSnap.val();
              activeContacts.push({
                id: [activeUser.username, fUsername].sort().join('_'),
                friendUsername: fUsername,
                name: uData.name || fUsername,
                status: uData.status || '⚪ Offline',
                profilePic: uData.profilePic || '',
                type: 'private'
              });
              setContacts([...activeContacts]);
            }
          });
        });
      } else {
        setContacts(activeContacts);
      }
    });

    return () => {
      database.ref('users/' + activeUser.username + '/status').off();
      reqRef.off();
      contactsRef.off();
    };
  }, []);

  const openAddModal = () => {
    setIsModalVisible(true);
    database.ref('users').once('value').then(async (snap) => {
      if(!snap.exists()) return;
      const allUsers = snap.val();
      const usersArray: any[] = [];
      const contactsSnap = await database.ref('contacts/' + activeUser.username).once('value');
      const myContacts = contactsSnap.val() || {};

      for (let u in allUsers) {
        if(u === activeUser.username) continue;
        let relation = 'connect'; 
        if(myContacts[u]) relation = 'added';
        else {
          const checkReq = await database.ref('requests/' + u + '/' + activeUser.username).once('value');
          if(checkReq.exists()) relation = 'sent';
        }
        usersArray.push({ username: u, name: allUsers[u].name || u, profilePic: allUsers[u].profilePic || '', relation });
      }
      setGlobalUsers(usersArray);
    });
  };

  const sendChatRequest = (targetUser: string, index: number) => {
    database.ref('requests/' + targetUser + '/' + activeUser.username).set({
      senderUsername: activeUser.username, senderName: activeUser.name, timestamp: Date.now()
    }).then(() => {
      const updated = [...globalUsers];
      updated[index].relation = 'sent';
      setGlobalUsers(updated);
    });
  };

  const acceptRequest = (targetUser: string, targetName: string) => {
    database.ref('contacts/' + activeUser.username + '/' + targetUser).set({ name: targetName, addedAt: Date.now() });
    database.ref('contacts/' + targetUser + '/' + activeUser.username).set({ name: activeUser.name, addedAt: Date.now() });
    database.ref('requests/' + activeUser.username + '/' + targetUser).remove();
  };

  const declineRequest = (targetUser: string) => database.ref('requests/' + activeUser.username + '/' + targetUser).remove();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.avatar}>
            {activeUser?.profilePic ? <Image source={{uri: activeUser.profilePic}} style={styles.avatarImg}/> : <Text style={styles.avatarText}>{activeUser?.name ? activeUser.name.charAt(0).toUpperCase() : 'U'}</Text>}
          </View>
          <View>
            <Text style={styles.headerTitle}>Chats</Text>
            <Text style={styles.statusLabel}>{myStatus}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={onLogout}><Text style={styles.logoutText}>Logout</Text></TouchableOpacity>
      </View>

      {requests.length > 0 && (
        <View style={styles.requestSection}>
          <Text style={styles.requestSecTitle}>Pending Invites</Text>
          {requests.map(item => (
            <View key={item.uid} style={styles.reqCard}>
              <Text style={styles.reqText}>{item.senderName} wants to chat</Text>
              <View style={{flexDirection: 'row', gap: 5}}>
                <TouchableOpacity style={[styles.reqActionBtn, {backgroundColor: '#0A2540'}]} onPress={() => acceptRequest(item.uid, item.senderName)}><Text style={{color:'#fff', fontSize:11, fontWeight:'700'}}>Accept</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.reqActionBtn, {backgroundColor: '#E2E8F0'}]} onPress={() => declineRequest(item.uid)}><Text style={{color: '#242424', fontSize:11, fontWeight:'700'}}>Decline</Text></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={({item}) => (
          <TouchableOpacity style={styles.contactItem} onPress={() => navigation.navigate('ChatRoom', { chatId: item.id, chatName: item.name })}>
            <View style={[styles.avatar, {backgroundColor: '#0A2540'}]}>
              {item.profilePic ? <Image source={{uri: item.profilePic}} style={styles.avatarImg}/> : <Text style={styles.avatarText}>{item.name.charAt(0).toUpperCase()}</Text>}
              {item.type === 'private' && <View style={[styles.statusIndicatorDot, {backgroundColor: item.status?.includes('🟢') ? '#6BB700' : item.status?.includes('🔴') ? '#C4314B' : '#94a3b8'}]}/>}
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactSub}>{item.type === 'group' ? 'Company Wide Channel' : item.status}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={[styles.fab, {backgroundColor: '#0A2540'}]} onPress={openAddModal}><Text style={styles.fabText}>+</Text></TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeaderTitle}>Start New Conversation</Text>
            <FlatList
              data={globalUsers}
              keyExtractor={(item) => item.username}
              renderItem={({item, index}) => (
                <View style={styles.searchUserItem}>
                  <View style={{flexDirection: 'row', alignItems: 'center', gap: 10}}>
                    <View style={[styles.avatar, {width: 32, height: 32, backgroundColor: '#0A2540'}]}>
                      {item.profilePic ? <Image source={{uri: item.profilePic}} style={styles.avatarImg}/> : <Text style={[styles.avatarText, {fontSize:12}]}>{item.name.charAt(0).toUpperCase()}</Text>}
                    </View>
                    <View>
                      <Text style={{fontWeight: '700', fontSize: 13, color:'#242424'}}>{item.name}</Text>
                      <Text style={{fontSize: 11, color:'#616161'}}>@{item.username}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.modalConnectBtn, item.relation === 'connect' ? {backgroundColor: '#0A2540'} : {backgroundColor: '#E2E8F0'}]} disabled={item.relation !== 'connect'} onPress={() => sendChatRequest(item.username, index)}>
                    <Text style={{fontSize: 11, fontWeight: '700', color: item.relation === 'connect' ? '#fff' : '#242424'}}>{item.relation === 'connect' ? 'Connect' : item.relation === 'sent' ? 'Sent' : 'Added'}</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsModalVisible(false)}><Text style={{fontWeight:'700'}}>Close</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ==========================================
// 3. CHAT ROOM SCREEN
// ==========================================
const ChatRoomScreen = ({ route, navigation, activeUser }: any) => {
  const { chatId, chatName } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [msgInput, setMsgInput] = useState('');

  useEffect(() => {
    const chatRef = database.ref('chats/' + chatId);
    chatRef.limitToLast(50).on('value', snap => {
      const msgs: any[] = [];
      if(snap.exists()) snap.forEach(child => { msgs.push({ id: child.key, ...child.val() }); });
      setMessages(msgs.reverse());
    });
    return () => chatRef.off();
  }, [chatId]);

  const sendMessage = () => {
    if(!msgInput.trim()) return;
    database.ref('chats/' + chatId).push({
      sender: activeUser.name, username: activeUser.username, profilePic: activeUser.profilePic || '',
      text: msgInput.trim(), type: 'text', timestamp: Date.now()
    });
    setMsgInput('');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.chatHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{paddingRight: 15}}><Text style={{fontSize: 24, color: '#0A2540', fontWeight:'700'}}>←</Text></TouchableOpacity>
          <Text style={styles.chatHeaderTitle}>{chatName}</Text>
        </View>

        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={{ padding: 15 }}
          renderItem={({item}) => {
            const isMe = item.username === activeUser?.username;
            return (
              <View style={[styles.msgWrapper, isMe ? styles.msgSent : styles.msgReceived]}>
                {!isMe && (
                  <View style={[styles.smallAvatar, {marginRight: 8, marginTop: 12, backgroundColor: '#0A2540'}]}>
                    {item.profilePic ? <Image source={{uri: item.profilePic}} style={styles.avatarImg}/> : <Text style={styles.smallAvatarText}>{item.sender ? item.sender.charAt(0).toUpperCase() : 'U'}</Text>}
                  </View>
                )}
                <View style={isMe ? {alignItems: 'flex-end'} : {alignItems: 'flex-start'}}>
                  <Text style={styles.msgSenderName}>{isMe ? 'You' : item.sender}</Text>
                  <View style={[styles.bubble, isMe ? styles.bubbleSent : styles.bubbleReceived]}>
                    <Text style={{fontSize: 14, color: isMe ? '#fff' : '#242424'}}>{item.text}</Text>
                  </View>
                </View>
              </View>
            );
          }}
        />
        <View style={styles.inputArea}>
          <TextInput style={styles.chatInput} placeholder="Type a message" value={msgInput} onChangeText={setMsgInput} multiline />
          <TouchableOpacity style={[styles.sendBtn, {backgroundColor: '#0A2540'}]} onPress={sendMessage}><Text style={{color: '#fff', fontWeight: 'bold', fontSize:13}}>Send</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// ==========================================
// 4. MAIN APP ROUTER (With Provider Fix)
// ==========================================
export default function App() {
  const [activeUser, setActiveUser] = useState<any>(null);

  const handleLogout = () => {
    if(activeUser) database.ref('users/' + activeUser.username + '/status').set('⚪ Offline');
    setActiveUser(null);
  };

  return (
    <SafeAreaProvider>
      <NavigationIndependentTree>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            {!activeUser ? (
              <Stack.Screen name="Login">
                {props => <LoginScreen {...props} onLogin={setActiveUser} />}
              </Stack.Screen>
            ) : (
              <>
                <Stack.Screen name="ChatList">
                  {props => <ChatListScreen {...props} activeUser={activeUser} onLogout={handleLogout} />}
                </Stack.Screen>
                <Stack.Screen name="ChatRoom">
                  {props => <ChatRoomScreen {...props} activeUser={activeUser} />}
                </Stack.Screen>
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </NavigationIndependentTree>
    </SafeAreaProvider>
  );
}

// ==========================================
// PREMIUM WEBSITE MATCHED THEME STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loginContainer: { flex: 1, backgroundColor: '#F4F6F8', justifyContent: 'center' },
  loginFlex: { paddingHorizontal: 24, alignItems: 'center' },
  
  // Asli Portal Card Feel
  premiumCard: { 
    width: '100%', 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 24, 
    paddingVertical: 36, 
    borderRadius: 20, 
    shadowColor: '#0A2540', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.06, 
    shadowRadius: 20, 
    elevation: 5,
    borderWidth: 1,
    borderColor: '#EFF2F6'
  },
  
  // Custom Dynamic Logo Styling
  logoWrapper: { alignItems: 'center', marginBottom: 20 },
  logoCirclePair: { flexDirection: 'row', marginBottom: 8 },
  logoCircle: { width: 28, height: 28, borderRadius: 14 },
  brandName: { fontSize: 18, fontWeight: '800', color: '#0A2540', letterSpacing: 0.5 },
  portalHeading: { fontSize: 22, fontWeight: '700', color: '#0A2540', textAlign: 'center', marginBottom: 28 },
  
  // Clean Form Styling
  inputGroup: { width: '100%', marginBottom: 18 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#4A5568', marginBottom: 6, paddingLeft: 2 },
  premiumInput: { 
    backgroundColor: '#FFFFFF', 
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    borderRadius: 10, 
    borderWidth: 1.5, 
    borderColor: '#E2E8F0', 
    fontSize: 14, 
    color: '#0A2540' 
  },
  
  // Core Buttons
  authenticateBtn: { 
    backgroundColor: '#0A2540', 
    paddingVertical: 14, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 12,
    shadowColor: '#0A2540',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3
  },
  authenticateBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  forgotBtn: { marginTop: 16, alignItems: 'center' },
  forgotBtnText: { color: '#00A3E0', fontWeight: '600', fontSize: 13 },
  
  // Chats & General Styles
  header: { padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EFF2F6', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0A2540' },
  statusLabel: { fontSize: 11, fontWeight: '700', color: '#718096' },
  logoutText: { color: '#C4314B', fontWeight: '700', fontSize: 13 },
  contactItem: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#fff', marginHorizontal: 12, marginTop: 8, borderRadius: 12, borderWidth: 1, borderColor: '#EFF2F6' },
  contactName: { fontSize: 14, fontWeight: '700', color: '#0A2540' },
  contactSub: { fontSize: 11, color: '#718096', fontWeight: '600', marginTop: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#00A3E0', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarImg: { width: '100%', height: '100%', borderRadius: 20 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  statusIndicatorDot: { position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#fff' },
  smallAvatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  smallAvatarText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  chatHeader: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#EFF2F6' },
  chatHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#0A2540' },
  msgWrapper: { flexDirection: 'row', marginBottom: 12, maxWidth: '80%' },
  msgSent: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgReceived: { alignSelf: 'flex-start' },
  msgSenderName: { fontSize: 11, color: '#718096', marginBottom: 3, fontWeight: '600', paddingHorizontal: 4 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  bubbleSent: { backgroundColor: '#0A2540', borderBottomRightRadius: 1 },
  bubbleReceived: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E2E8F0', borderBottomLeftRadius: 1 },
  inputArea: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#EFF2F6', alignItems: 'center' },
  chatInput: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, fontSize: 14, maxHeight: 80, color: '#0A2540' },
  sendBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 18, marginLeft: 8 },
  fab: { position: 'absolute', right: 20, bottom: 20, width: 52, height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: '#0A2540', shadowOpacity: 0.15, shadowRadius: 5 },
  fabText: { color: '#fff', fontSize: 26, fontWeight: '300', marginTop: -2 },
  requestSection: { paddingHorizontal: 12, marginTop: 10 },
  requestSecTitle: { fontSize: 11, fontWeight: '800', color: '#C4314B', textTransform: 'uppercase', marginBottom: 5, marginLeft: 4 },
  reqCard: { backgroundColor: '#FFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reqText: { fontSize: 12, fontWeight: '700', color: '#0A2540' },
  reqActionBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', height: '70%', backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalHeaderTitle: { fontSize: 16, fontWeight: '800', marginBottom: 15, color: '#0A2540' },
  searchUserItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 10, borderBottomWidth: 1, borderBottomColor: '#EFF2F6' },
  modalConnectBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 4 },
  modalCloseBtn: { backgroundColor: '#E2E8F0', padding: 12, borderRadius: 6, alignItems: 'center', marginTop: 10 }
});