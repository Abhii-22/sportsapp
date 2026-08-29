import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from './_layout';

// const API_BASE_URL = 'https://sportsapp-2c1m.onrender.com';
const API_BASE_URL = 'http://192.168.1.4:5000';

export default function AuthScreen() {
  const { loginUserSession } = useAuth();
  const [isLoginFlow, setIsLoginFlow] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form States
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [securePasswordText, setSecurePasswordText] = useState(true);

  // Request OTP from Backend
  const handleSendOtp = async () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
      Alert.alert('Required Fields', 'Please complete your Full Name, Email, Phone, and Password first.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const data = await response.json();
      setLoading(false);

      if (data.success) {
        setOtpSent(true);
        Alert.alert('OTP Sent!', `A 6-digit verification code was sent to ${email.trim()}.`);
      } else {
        Alert.alert('Unable to Send OTP', data.message || 'Error sending email verification code.');
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Connection Error', error.message || 'Unable to contact verification server.');
    }
  };

  // Sign In or Verify Registration
  const handleAuthentication = async () => {
    if (isLoginFlow) {
      if (!email.trim() || !password.trim()) {
        Alert.alert('Required Fields', 'Please enter your email and account password to proceed.');
        return;
      }
    } else {
      if (!otpSent) {
        handleSendOtp();
        return;
      }
      if (!otp.trim() || otp.trim().length !== 6) {
        Alert.alert('Invalid OTP', 'Please enter the full 6-digit code received on your email.');
        return;
      }
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
            otp: otp.trim(),
          };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setLoading(false);

      if (data.success && data.user) {
        Alert.alert(
          isLoginFlow ? 'Welcome Back!' : 'Account Verified!',
          isLoginFlow ? 'Sign-in verified successfully.' : 'Your email and organizer profile are verified.'
        );

        loginUserSession({
          id: data.user.id || data.user._id,
          fullName: data.user.fullName,
          email: data.user.email,
          phone: data.user.phone,
          role: data.user.role || 'ORGANIZER',
          token: data.token,
        });
      } else {
        Alert.alert('Authentication Failed', data.message || 'Error processing request.');
      }
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Connection Error', error.message || 'Unable to reach backend server.');
    }
  };

  const toggleFlow = () => {
    setIsLoginFlow(!isLoginFlow);
    setOtpSent(false);
    setOtp('');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.mainContainer}>
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <View style={styles.brandingHeaderContainer}>
          <View style={styles.logoCircleBadge}><Ionicons name="fitness" size={42} color="#FFFFFF" /></View>
          <Text style={styles.brandingTitleText}>AK SPORTS</Text>
          <Text style={styles.brandingSubtitleText}>
            {isLoginFlow ? 'Access your Umpire Desk & Live Match Boards' : 'Register an official verified organizer profile'}
          </Text>
        </View>

        <View style={styles.authFormCardBox}>
          <Text style={styles.formContextSwitchLabelTitle}>{isLoginFlow ? 'Sign In' : 'Create Account'}</Text>

          {!isLoginFlow && (
            <>
              <Text style={styles.fieldSectionLabelInputTitle}>Full Name</Text>
              <View style={styles.inputFieldWrapperFrame}>
                <Ionicons name="person-outline" size={18} color="#059669" style={styles.fieldDecorationIcon} />
                <TextInput style={styles.formTextInputFieldNode} placeholder="e.g., Abhishek" placeholderTextColor="#94A3B8" value={fullName} onChangeText={setFullName} editable={!otpSent} />
              </View>
            </>
          )}

          <Text style={styles.fieldSectionLabelInputTitle}>Email Address</Text>
          <View style={styles.inputFieldWrapperFrame}>
            <Ionicons name="mail-outline" size={18} color="#059669" style={styles.fieldDecorationIcon} />
            <TextInput style={styles.formTextInputFieldNode} placeholder="name@domain.com" placeholderTextColor="#94A3B8" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} editable={!otpSent} />
          </View>

          {!isLoginFlow && (
            <>
              <Text style={styles.fieldSectionLabelInputTitle}>Phone Number</Text>
              <View style={styles.inputFieldWrapperFrame}>
                <Ionicons name="call-outline" size={18} color="#059669" style={styles.fieldDecorationIcon} />
                <TextInput style={styles.formTextInputFieldNode} placeholder="+91 XXXXX XXXXX" placeholderTextColor="#94A3B8" keyboardType="phone-pad" value={phone} onChangeText={setPhone} editable={!otpSent} />
              </View>
            </>
          )}

          <Text style={styles.fieldSectionLabelInputTitle}>Password</Text>
          <View style={styles.inputFieldWrapperFrame}>
            <Ionicons name="lock-closed-outline" size={18} color="#059669" style={styles.fieldDecorationIcon} />
            <TextInput style={styles.formTextInputFieldNode} placeholder="••••••••" placeholderTextColor="#94A3B8" secureTextEntry={securePasswordText} autoCapitalize="none" value={password} onChangeText={setPassword} editable={!otpSent} />
            <TouchableOpacity onPress={() => setSecurePasswordText(!securePasswordText)} style={styles.passwordVisToggleTouchHitbox}>
              <Ionicons name={securePasswordText ? "eye-off-outline" : "eye-outline"} size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* OTP Verification Input */}
          {!isLoginFlow && otpSent && (
            <View style={styles.otpBlockContainer}>
              <Text style={[styles.fieldSectionLabelInputTitle, { color: '#059669' }]}>Enter 6-Digit Email Code</Text>
              <View style={[styles.inputFieldWrapperFrame, styles.otpHighlightWrapper]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#059669" style={styles.fieldDecorationIcon} />
                <TextInput
                  style={[styles.formTextInputFieldNode, styles.otpTextInput]}
                  placeholder="000000"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
              </View>
              <TouchableOpacity onPress={handleSendOtp} disabled={loading}>
                <Text style={styles.resendCodeText}>Didn't receive code? Resend OTP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Master Action Button */}
          <TouchableOpacity 
            style={styles.masterAuthActionButtonNode} 
            activeOpacity={0.88} 
            onPress={isLoginFlow ? handleAuthentication : (otpSent ? handleAuthentication : handleSendOtp)} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.masterAuthActionButtonTextLabel}>
                {isLoginFlow ? 'Sign In to Dashboard' : (otpSent ? 'Verify OTP & Complete Sign Up' : 'Get Email Verification Code')}
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.toggleContextFooterLinkAlignmentInlineRow}>
            <Text style={styles.footerContextDescriptionRegularTextText}>{isLoginFlow ? "Don't have an official account?" : 'Already registered?'}</Text>
            <TouchableOpacity onPress={toggleFlow}>
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
  
  otpBlockContainer: { marginTop: 4, marginBottom: 4 },
  otpHighlightWrapper: { borderColor: '#86EFAC', backgroundColor: '#F0FDF4' },
  otpTextInput: { letterSpacing: 8, fontSize: 18, fontWeight: '900', color: '#0F172A' },
  resendCodeText: { fontSize: 12, fontWeight: '700', color: '#059669', textAlign: 'right', marginTop: -10, marginBottom: 14 },

  masterAuthActionButtonNode: { backgroundColor: '#0F172A', height: 50, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 6, marginBottom: 12 },
  masterAuthActionButtonTextLabel: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  toggleContextFooterLinkAlignmentInlineRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 10 },
  footerContextDescriptionRegularTextText: { color: '#64748B', fontSize: 13, fontWeight: '500' },
  footerInteractiveModeSwitchActionLinkText: { color: '#059669', fontSize: 13, fontWeight: '800' },
});