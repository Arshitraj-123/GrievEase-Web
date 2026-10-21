export type Locale = 'en' | 'hi' | 'mr';

export interface AuthTranslations {
  loginTitle: string;
  loginSubtitle: string;
  usernameLabel: string;
  usernamePlaceholder: string;
  passwordLabel: string;
  passwordPlaceholder: string;
  loginButton: string;
  loggingIn: string;
  activateAccount: string;
  forgotPassword: string;
  accountHelp: string;
  activationTitle: string;
  activationSubtitle: string;
  activationCodeLabel: string;
  activationCodePlaceholder: string;
  verifyDetailLabel: string;
  verifyDetailPlaceholder: string;
  verifyAndContinue: string;
  twoFactorTitle: string;
  twoFactorSubtitle: string;
  twoFactorCodeLabel: string;
  twoFactorPlaceholder: string;
  verify2faButton: string;
  useBackupCode: string;
  recoveryTitle: string;
  recoverySubtitle: string;
  recoveryCodeTab: string;
  securityQuestionsTab: string;
  newPasswordLabel: string;
  confirmPasswordLabel: string;
  resetPasswordButton: string;
  sessionExpiredTitle: string;
  sessionExpiredSubtitle: string;
  backToLogin: string;
}

export const dictionaries: Record<Locale, AuthTranslations> = {
  en: {
    loginTitle: 'Sign In to GrievEase',
    loginSubtitle: 'Society Grievance & Community Portal',
    usernameLabel: 'Username or Member ID',
    usernamePlaceholder: 'e.g. GV-A101-R1',
    passwordLabel: 'Password',
    passwordPlaceholder: 'Enter your password',
    loginButton: 'Sign In',
    loggingIn: 'Signing in...',
    activateAccount: 'Activate your account',
    forgotPassword: 'Forgot password?',
    accountHelp: 'Account locked or disabled?',
    activationTitle: 'Activate Your Account',
    activationSubtitle: 'Enter the one-time activation code handed over by your society secretary',
    activationCodeLabel: '10-Character Activation Code',
    activationCodePlaceholder: 'e.g. 7K2M9X4R8P',
    verifyDetailLabel: 'Verification Detail (Flat number or DOB)',
    verifyDetailPlaceholder: 'e.g. A-101 or 1985-05-12',
    verifyAndContinue: 'Verify & Continue',
    twoFactorTitle: 'Two-Factor Authentication',
    twoFactorSubtitle: 'Enter the 6-digit code from your authenticator app or an 8-character backup code',
    twoFactorCodeLabel: 'Authentication Code',
    twoFactorPlaceholder: '123456',
    verify2faButton: 'Verify & Access Portal',
    useBackupCode: 'Use offline backup code instead',
    recoveryTitle: 'Account Recovery',
    recoverySubtitle: 'Reset your credentials using recovery codes or security questions',
    recoveryCodeTab: 'Recovery Code',
    securityQuestionsTab: 'Security Questions',
    newPasswordLabel: 'New Password',
    confirmPasswordLabel: 'Confirm New Password',
    resetPasswordButton: 'Reset Password',
    sessionExpiredTitle: 'Session Expired',
    sessionExpiredSubtitle: 'You were logged out after 15 minutes of inactivity for security',
    backToLogin: 'Return to Login',
  },
  hi: {
    loginTitle: 'ग्रीवईज़ में साइन इन करें',
    loginSubtitle: 'सोसाइटी शिकायत और समुदाय पोर्टल',
    usernameLabel: 'यूज़रनेम या सदस्य आईडी',
    usernamePlaceholder: 'उदा. GV-A101-R1',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: 'अपना पासवर्ड दर्ज करें',
    loginButton: 'साइन इन करें',
    loggingIn: 'साइन इन हो रहा है...',
    activateAccount: 'अपना खाता सक्रिय करें',
    forgotPassword: 'पासवर्ड भूल गए?',
    accountHelp: 'खाता लॉक या अक्षम है?',
    activationTitle: 'अपना खाता सक्रिय करें',
    activationSubtitle: 'अपने सोसाइटी सचिव द्वारा दिया गया वन-टाइम एक्टिवेशन कोड दर्ज करें',
    activationCodeLabel: '10-अक्षरों का एक्टिवेशन कोड',
    activationCodePlaceholder: 'उदा. 7K2M9X4R8P',
    verifyDetailLabel: 'सत्यापन विवरण (फ्लैट नंबर या जन्मतिथि)',
    verifyDetailPlaceholder: 'उदा. A-101 या 1985-05-12',
    verifyAndContinue: 'सत्यापित करें और आगे बढ़ें',
    twoFactorTitle: 'दो-चरणीय प्रमाणीकरण (2FA)',
    twoFactorSubtitle: 'अपने प्रमाणक ऐप से 6 अंकों का कोड या 8-वर्ण बैकअप कोड दर्ज करें',
    twoFactorCodeLabel: 'प्रमाणीकरण कोड',
    twoFactorPlaceholder: '123456',
    verify2faButton: 'सत्यापित करें और पोर्टल में प्रवेश करें',
    useBackupCode: 'इसके बजाय ऑफ़लाइन बैकअप कोड का उपयोग करें',
    recoveryTitle: 'खाता पुनर्प्राप्ति',
    recoverySubtitle: 'रिकवरी कोड या सुरक्षा प्रश्नों का उपयोग करके क्रेडेंशियल रीसेट करें',
    recoveryCodeTab: 'रिकवरी कोड',
    securityQuestionsTab: 'सुरक्षा प्रश्न',
    newPasswordLabel: 'नया पासवर्ड',
    confirmPasswordLabel: 'नया पासवर्ड पुनः दर्ज करें',
    resetPasswordButton: 'पासवर्ड रीसेट करें',
    sessionExpiredTitle: 'सत्र समाप्त हो गया',
    sessionExpiredSubtitle: 'सुरक्षा के लिए 15 मिनट की निष्क्रियता के बाद आपको लॉग आउट कर दिया गया',
    backToLogin: 'लॉगिन पर लौटें',
  },
  mr: {
    loginTitle: 'ग्रीवईझ मध्ये साइन इन करा',
    loginSubtitle: 'सोसायटी तक्रार आणि समुदाय पोर्टल',
    usernameLabel: 'युझरनेम किंवा सदस्य आयडी',
    usernamePlaceholder: 'उदा. GV-A101-R1',
    passwordLabel: 'पासवर्ड',
    passwordPlaceholder: 'आपला पासवर्ड प्रविष्ट करा',
    loginButton: 'साइन इन करा',
    loggingIn: 'साइन इन होत आहे...',
    activateAccount: 'आपले खाते सक्रिय करा',
    forgotPassword: 'पासवर्ड विसरलात?',
    accountHelp: 'खाते लॉक किंवा अक्षम केले आहे?',
    activationTitle: 'आपले खाते सक्रिय करा',
    activationSubtitle: 'आपल्या सोसायटी सचिवांनी दिलेला वन-टाइम अ‍ॅक्टिव्हेशन कोड प्रविष्ट करा',
    activationCodeLabel: '10-अक्षरी अ‍ॅक्टिव्हेशन कोड',
    activationCodePlaceholder: 'उदा. 7K2M9X4R8P',
    verifyDetailLabel: 'पडताळणी तपशील (फ्लॅट क्रमांक किंवा जन्मतारीख)',
    verifyDetailPlaceholder: 'उदा. A-101 किंवा 1985-05-12',
    verifyAndContinue: 'पडताळणी करा आणि पुढे जा',
    twoFactorTitle: 'दोन-टप्प्यांची प्रमाणीकरण (2FA)',
    twoFactorSubtitle: 'आपल्या प्रमाणीकरण अ‍ॅपमधील 6-अंकी कोड किंवा 8-वर्ण बॅकअप कोड प्रविष्ट करा',
    twoFactorCodeLabel: 'प्रमाणीकरण कोड',
    twoFactorPlaceholder: '123456',
    verify2faButton: 'पडताळणी करा आणि पोर्टलमध्ये प्रवेश करा',
    useBackupCode: 'त्याऐवजी ऑफलाइन बॅकअप कोड वापरा',
    recoveryTitle: 'खाते पुनर्प्राप्ती',
    recoverySubtitle: 'रिकव्हरी कोड किंवा सुरक्षा प्रश्नांचा वापर करून पासवर्ड रीसेट करा',
    recoveryCodeTab: 'रिकव्हरी कोड',
    securityQuestionsTab: 'सुरक्षा प्रश्न',
    newPasswordLabel: 'नवीन पासवर्ड',
    confirmPasswordLabel: 'नवीन पासवर्ड पुन्हा प्रविष्ट करा',
    resetPasswordButton: 'पासवर्ड रीसेट करा',
    sessionExpiredTitle: 'सत्र कालबाह्य झाले',
    sessionExpiredSubtitle: 'सुरक्षिततेसाठी 15 मिनिटांच्या निष्क्रियतेनंतर आपण लॉग आउट झाला आहात',
    backToLogin: 'लॉगिनवर परत जा',
  },
};

export function getDictionary(locale: Locale = 'en'): AuthTranslations {
  return dictionaries[locale] || dictionaries.en;
}
