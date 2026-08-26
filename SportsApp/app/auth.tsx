import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './_layout';

const API_BASE_URL = 'https://sportsapp-2c1m.onrender.com';

export default function AuthScreen() {
  const { loginUserSession } = useAuth();
  const [isLoginFlow, setIsLoginFlow] = useState(true);
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [securePasswordText, setSecurePasswordText] = useState(true);

  const handleAuthentication = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please enter your email and account password to proceed.');
      return;
    }

    if (!isLoginFlow && (!fullName.trim() || !phone.trim())) {
      Alert.alert('Required Fields', 'Please complete your Name and Contact Phone number.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLoginFlow ? '/api/auth/login' : '/api/auth/register';
      const payload = isLoginFlow
        ? { email: email.trim().toLowerCase(), password: password.trim() }
        : {
            fullName: fullName.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            password: password.trim(),
            role: 'ORGANIZER',
          };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const rawText = await response.text();

      if (!rawText || rawText.trim() === '' || rawText.trim().startsWith('<')) {
        throw new Error('Backend server is waking up on Render. Please try again in 30 seconds.');
      }

      let data;
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('Received unexpected non-JSON response from server.');
      }

      setLoading(false);

      if (data.success && data.user) {
        Alert.alert(
          isLoginFlow ? 'Welcome Back!' : 'Account Created!',
          isLoginFlow ? 'Sign-in verified successfully.' : 'Your account is registered in MongoDB.'
        );

        loginUserSession({
          id: data.user.id || data.user._id,
          fullName: data.user.fullName,
          email: data.user.email,
          phone: data.user.phone,
          role: data.user.role || 'ORGANIZER',
          token: data.token,
        });

        if (!isLoginFlow) {
          setIsLoginFlow(true);
        }
      } else {
        Alert.alert('Authentication Failed', data.message || 'Error processing request.');
      }
    } catch (error: any) {
      setLoading(false);
      console.error('Auth Request Error:', error);
      Alert.alert(
        'Connection Error',
        error.message || 'Unable to reach backend server. Please verify your connection.'
      );
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <View style={styles.brandingHeaderContainer}>
          <View style={styles.logoCircleBadge}><Ionicons name="fitness" size={42} color="#FFFFFF" /></View>
          <Text style={styles.brandingTitleText}>AK SPORTS</Text>
          <Text style={styles.brandingSubtitleText}>
            {isLoginFlow ? 'Access your Umpire Desk & Live Match Boards' : 'Register an official coordinator profile'}
          </Text>
        </View>

        <View style={styles.authFormCardBox}>
          <Text style={styles.formContextSwitchLabelTitle}>{isLoginFlow ? 'Sign In' : 'Create Account'}</Text>

          {!isLoginFlow && (
            <>
              <Text style={styles.fieldSectionLabelInputTitle}>Full Name</Text>
              <View style={styles.inputFieldWrapperFrame}>
                <Ionicons name="person-outline" size={18} color="#059669" style={styles.fieldDecorationIcon} />
                <TextInput style={styles.formTextInputFieldNode} placeholder="e.g., Aniket Kumar" placeholderTextColor="#94A3B8" value={fullName} onChangeText={setFullName} />
              </View>
            </>
          )}

          <Text style={styles.fieldSectionLabelInputTitle}>Email Address</Text>
          <View style={styles.inputFieldWrapperFrame}>
            <Ionicons name="mail-outline" size={18} color="#059669" style={styles.fieldDecorationIcon} />
            <TextInput style={styles.formTextInputFieldNode} placeholder="name@domain.com" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
          </View>

          {!isLoginFlow && (
            <>
              <Text style={styles.fieldSectionLabelInputTitle}>Phone Number</Text>
              <View style={styles.inputFieldWrapperFrame}>
                <Ionicons name="call-outline" size={18} color="#059669" style={styles.fieldDecorationIcon} />
                <TextInput style={styles.formTextInputFieldNode} placeholder="+91 XXXXX XXXXX" placeholderTextColor="#94A3B8" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
              </View>
            </>
          )}

          <Text style={styles.fieldSectionLabelInputTitle}>Password</Text>
          <View style={styles.inputFieldWrapperFrame}>
            <Ionicons name="lock-closed-outline" size={18} color="#059669" style={styles.fieldDecorationIcon} />
            <TextInput style={styles.formTextInputFieldNode} placeholder="••••••••" placeholderTextColor="#94A3B8" secureTextEntry={securePasswordText} autoCapitalize="none" value={password} onChangeText={setPassword} />
            <TouchableOpacity onPress={() => setSecurePasswordText(!securePasswordText)} style={styles.passwordVisToggleTouchHitbox}>
              <Ionicons name={securePasswordText ? "eye-off-outline" : "eye-outline"} size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.masterAuthActionButtonNode} activeOpacity={0.88} onPress={handleAuthentication} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.masterAuthActionButtonTextLabel}>{isLoginFlow ? 'Sign In to Dashboard' : 'Complete Registration'}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.toggleContextFooterLinkAlignmentInlineRow}>
            <Text style={styles.footerContextDescriptionRegularTextText}>{isLoginFlow ? "Don't have an official account?" : 'Already registered?'}</Text>
            <TouchableOpacity onPress={() => setIsLoginFlow(!isLoginFlow)}>
              <Text style={styles.footerInteractiveModeSwitchActionLinkText}>{isLoginFlow ? ' Sign Up' : ' Sign In'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  mainContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  scrollContainer: { flexGrow: 1, paddingHorizontal: 24, justifyContent: 'center', paddingVertical: 40 },
  brandingHeaderContainer: { alignItems: 'center', marginBottom: 28 },
  logoCircleBadge: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  brandingTitleText: { fontSize: 26, fontWeight: '900', color: '#0F172A' },
  brandingSubtitleText: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, paddingHorizontal: 20, fontWeight: '500' },
  authFormCardBox: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#E2E8F0' },
  formContextSwitchLabelTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
  fieldSectionLabelInputTitle: { fontSize: 11, fontWeight: '800', color: '#64748B', marginBottom: 6, textTransform: 'uppercase' },
  inputFieldWrapperFrame: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 14, marginBottom: 18, height: 48, position: 'relative' },
  fieldDecorationIcon: { marginRight: 10 },
  formTextInputFieldNode: { flex: 1, color: '#0F172A', fontSize: 14, height: '100%', fontWeight: '600' },
  passwordVisToggleTouchHitbox: { position: 'absolute', right: 14, height: '100%', justifyContent: 'center' },
  masterAuthActionButtonNode: { backgroundColor: '#0F172A', height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6, marginBottom: 12 },
  masterAuthActionButtonTextLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  toggleContextFooterLinkAlignmentInlineRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  footerContextDescriptionRegularTextText: { color: '#64748B', fontSize: 13, fontWeight: '500' },
  footerInteractiveModeSwitchActionLinkText: { color: '#059669', fontSize: 13, fontWeight: '800' },
});