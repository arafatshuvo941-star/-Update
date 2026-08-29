import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Store,
  Mail,
  Lock,
  User,
  ShoppingBag,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AuthPage: React.FC = () => {
  const { signInWithGmail, signUpWithGmail, signInWithGoogleOneClick } = useStore();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sign In Form State
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign Up Form State
  const [signUpName, setSignUpName] = useState('');
  const [signUpShopName, setSignUpShopName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPhone, setSignUpPhone] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  // Gmail Validator Helper
  const isGmailAddress = (email: string): boolean => {
    if (!email) return false;
    const clean = email.trim().toLowerCase();
    return clean.endsWith('@gmail.com') && clean.length > 10;
  };

  const handleAppendGmail = (isSignUp: boolean) => {
    if (isSignUp) {
      const clean = signUpEmail.trim().split('@')[0];
      if (clean) setSignUpEmail(`${clean}@gmail.com`);
    } else {
      const clean = signInEmail.trim().split('@')[0];
      if (clean) setSignInEmail(`${clean}@gmail.com`);
    }
  };

  // Sign In Handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const email = signInEmail.trim().toLowerCase();
    if (!email) {
      setErrorMessage('অনুগ্রহ করে আপনার Gmail ঠিকানা লিখুন।');
      return;
    }

    if (!isGmailAddress(email)) {
      setErrorMessage('শুধুমাত্র @gmail.com ইমেইল ঠিকানা গ্রহণযোগ্য।');
      return;
    }

    if (!signInPassword) {
      setErrorMessage('অনুগ্রহ করে পাসওয়ার্ড প্রদান করুন।');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signInWithGmail(email, signInPassword);
      if (res.success) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      } else {
        setErrorMessage(res.error || 'সাইন ইন ব্যর্থ হয়েছে।');
      }
    } catch {
      setErrorMessage('একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  // Sign Up Handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const name = signUpName.trim();
    const shopName = signUpShopName.trim();
    const email = signUpEmail.trim().toLowerCase();
    const phone = signUpPhone.trim();
    const password = signUpPassword;
    const confirmPassword = signUpConfirmPassword;

    if (!name) {
      setErrorMessage('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।');
      return;
    }

    if (!shopName) {
      setErrorMessage('অনুগ্রহ করে আপনার দোকানের নাম লিখুন।');
      return;
    }

    if (!email) {
      setErrorMessage('অনুগ্রহ করে আপনার Gmail ঠিকানা লিখুন।');
      return;
    }

    if (!isGmailAddress(email)) {
      setErrorMessage('শুধুমাত্র Gmail (@gmail.com) অ্যাকাউন্ট দিয়ে সাইন আপ করা যাবে। অন্যান্য ডোমেইন অনুমোদিত নয়।');
      return;
    }

    if (!password || password.length < 4) {
      setErrorMessage('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি।');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUpWithGmail({
        name,
        shopName,
        email,
        phone,
        password,
      });

      if (res.success) {
        setSuccessMessage('আপনার অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে! স্বাগতম।');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } else {
        setErrorMessage(res.error || 'সাইন আপ ব্যর্থ হয়েছে।');
      }
    } catch {
      setErrorMessage('একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। আবার চেষ্টা করুন।');
    } finally {
      setIsLoading(false);
    }
  };

  // 1-Click Google Sign In (simulated instant login)
  const handleGoogleOneClick = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const targetEmail = mode === 'signup' && isGmailAddress(signUpEmail) 
        ? signUpEmail.trim().toLowerCase() 
        : mode === 'signin' && isGmailAddress(signInEmail)
        ? signInEmail.trim().toLowerCase()
        : 'demo.store@gmail.com';

      const targetName = signUpName.trim() || 'দোকানদার';

      const res = await signInWithGoogleOneClick(targetEmail, targetName);
      if (res.success) {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.6 },
        });
      } else {
        setErrorMessage(res.error || 'Google সাইন ইন ব্যর্থ হয়েছে।');
      }
    } catch {
      setErrorMessage('Google সাইন ইন সম্পন্ন করা সম্ভব হয়নি।');
    } finally {
      setIsLoading(false);
    }
  };

  // Demo fill helper
  const handleFillDemo = () => {
    setSignInEmail('arafatshuvo941@gmail.com');
    setSignInPassword('123456');
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center items-center p-3 sm:p-6 text-slate-100">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-4">
        {/* App Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            Universal Store Manager
          </h1>
          <p className="text-xs text-slate-300 font-medium">
            বাংলাদেশের ক্ষুদ্র ও মাঝারি ব্যবসার ডিজিটাল ক্যাশ মেমো ও হিসাব সফটওয়্যার
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-5">
          {/* Header Switcher Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              id="tab-btn-signin"
              type="button"
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signin'
                  ? 'bg-white dark:bg-slate-800 text-emerald-800 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'
              }`}
            >
              সাইন ইন (Sign In)
            </button>
            <button
              id="tab-btn-signup"
              type="button"
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'signup'
                  ? 'bg-white dark:bg-slate-800 text-emerald-800 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:text-slate-100'
              }`}
            >
              নতুন একাউন্ট (Sign Up)
            </button>
          </div>

          {/* Alert messages */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-rose-900 block">
                    {errorMessage.includes('unauthorized-domain')
                      ? 'Firebase ডোমেইন অনুমোদন জনিত তথ্য'
                      : 'ত্রুটি'}
                  </span>
                  <p>
                    {errorMessage.includes('unauthorized-domain')
                      ? 'এই ডোমেইনটি Firebase Auth-এ অথরাইজড করা নেই। আপনি উপরে ফর্ম দিয়ে সাধারণ সাইন আপ করতে পারেন অথবা নিচের বাটনে ক্লিক করে সরাসরি প্রবেশ করতে পারেন।'
                      : errorMessage}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setErrorMessage(null);
                  handleGoogleOneClick();
                }}
                className="w-full py-1.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>সরাসরি অ্যাপে প্রবেশ করুন (Direct Access)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* GMAIL ONLY NOTICE BADGE */}
          <div className="flex items-center gap-2 p-2.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-[11px] font-bold text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>শুধুমাত্র যেকোনো Gmail (@gmail.com) অ্যাকাউন্ট দিয়ে সাইন আপ বা সাইন ইন করুন।</span>
          </div>

          {/* SIGN IN FORM */}
          {mode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3.5">
              {/* Gmail Field */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  আপনার Gmail ঠিকানা:
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    id="input-signin-email"
                    type="email"
                    required
                    placeholder="example@gmail.com"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 transition-all"
                  />
                </div>
                {signInEmail && !signInEmail.includes('@') && (
                  <button
                    type="button"
                    onClick={() => handleAppendGmail(false)}
                    className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1 pt-0.5"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>+ @gmail.com যুক্ত করুন</span>
                  </button>
                )}
                {signInEmail && signInEmail.includes('@') && !isGmailAddress(signInEmail) && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    সতর্কতা: শুধুমাত্র @gmail.com ডোমেইন সমর্থিত।
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    পাসওয়ার্ড:
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      alert('পাসওয়ার্ড রিসেটের জন্য আপনার রেজিস্টার্ড Gmail ঠিকানায় যোগাযোগ করুন অথবা সরাসরি Google Sign In ব্যবহার করুন।');
                    }}
                    className="text-[11px] text-emerald-700 font-semibold hover:underline cursor-pointer"
                  >
                    ভুলে গেছেন?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    id="input-signin-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:text-slate-400 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="btn-submit-signin"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all active:scale-98 cursor-pointer disabled:opacity-70"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>সাইন ইন করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* SIGN UP FORM */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              {/* Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  আপনার নাম:
                </label>
                <div className="relative flex items-center">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    id="input-signup-name"
                    type="text"
                    required
                    placeholder="যেমন: মোঃ শফিকুল ইসলাম"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 transition-all"
                  />
                </div>
              </div>

              {/* Shop Name */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  দোকান / ব্যবসার নাম:
                </label>
                <div className="relative flex items-center">
                  <ShoppingBag className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    id="input-signup-shop-name"
                    type="text"
                    required
                    placeholder="যেমন: সাবির জেনারেল স্টোর"
                    value={signUpShopName}
                    onChange={(e) => setSignUpShopName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 transition-all"
                  />
                </div>
              </div>

              {/* Gmail Address */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Gmail অ্যাকাউন্ট (শুধুমাত্র @gmail.com):
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    id="input-signup-email"
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 transition-all"
                  />
                </div>
                {signUpEmail && !signUpEmail.includes('@') && (
                  <button
                    type="button"
                    onClick={() => handleAppendGmail(true)}
                    className="text-[11px] text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1 pt-0.5"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>+ @gmail.com যুক্ত করুন</span>
                  </button>
                )}
                {signUpEmail && signUpEmail.includes('@') && !isGmailAddress(signUpEmail) && (
                  <p className="text-[11px] text-rose-600 font-medium">
                    সতর্কতা: শুধুমাত্র @gmail.com ডোমেইন অনুমোদিত।
                  </p>
                )}
              </div>

              {/* Mobile Phone (Optional) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  মোবাইল নম্বর (ঐচ্ছিক):
                </label>
                <div className="relative flex items-center">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    id="input-signup-phone"
                    type="tel"
                    placeholder="017XXXXXXXX"
                    value={signUpPhone}
                    onChange={(e) => setSignUpPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 transition-all"
                  />
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    পাসওয়ার্ড:
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      id="input-signup-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="পাসওয়ার্ড"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      className="w-full pl-9 pr-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    নিশ্চিত করুন:
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
                    <input
                      id="input-signup-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="পুনরায় পাসওয়ার্ড"
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-2 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white dark:bg-slate-800 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Sign Up Button */}
              <button
                id="btn-submit-signup"
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all active:scale-98 cursor-pointer disabled:opacity-70 mt-2"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>অ্যাকাউন্ট তৈরি করুন (Sign Up)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Divider */}
          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink mx-3 text-slate-400 text-xs font-medium">অথবা</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          </div>

          {/* 1-Click Google Sign In */}
          <div className="space-y-2">
            <button
              id="btn-google-one-click"
              type="button"
              onClick={handleGoogleOneClick}
              disabled={isLoading}
              className="w-full py-2.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer hover:border-slate-300 dark:border-slate-600"
            >
              {/* Google G vector logo */}
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>যেকোনো Gmail দিয়ে ১-ক্লিক সাইন ইন</span>
            </button>

            {/* Quick Demo Fill in Sign In Mode */}
            {mode === 'signin' && (
              <button
                id="btn-demo-fill"
                type="button"
                onClick={handleFillDemo}
                className="w-full py-1 text-[11px] text-slate-500 hover:text-emerald-700 font-semibold cursor-pointer text-center"
              >
                ডেমো অ্যাকাউন্ট তথ্য বসান (arafatshuvo941@gmail.com)
              </button>
            )}
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-400">
          নিরাপদ ও এনক্রিপ্টেড ডাটাবেজ • সর্বস্বত্ব সংরক্ষিত ২০২৬
        </p>
      </div>
    </div>
  );
};
