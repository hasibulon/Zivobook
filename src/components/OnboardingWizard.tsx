import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User, Calendar, Shield, ArrowLeft, KeyRound, Check, 
  HelpCircle, ChevronRight, CheckCircle2, Phone, Sparkles
} from 'lucide-react';

interface OnboardingWizardProps {
  isDark: boolean;
  currentUser: any;
  onComplete: (onboardedData: {
    firstName: string;
    lastName: string;
    birthday: string;
    gender: string;
    phoneNumber: string;
    termsAgreed: boolean;
    displayName: string;
  }) => void;
  onLogout: () => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  isDark,
  currentUser,
  onComplete,
  onLogout
}) => {
  const [step, setStep] = useState(1);
  
  // States matching user's screenshots exactly
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthday, setBirthday] = useState('2002-06-21');
  const [gender, setGender] = useState('male'); // female, male, other
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.phoneNumber || '');
  const [password, setPassword] = useState('');
  const [rememberLogin, setRememberLogin] = useState(true);
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Helper calculation for birth age
  const getAge = (dateString: string) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const currentAge = getAge(birthday);

  // Format date correctly to match screenshot presentation e.g. "June 21, 2002"
  const formatBirthdayToShow = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return dateString;
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!firstName.trim() || !lastName.trim()) {
        alert("Please enter both First name and Last name.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!birthday) {
        alert("Please specify your date of birth.");
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
    } else if (step === 4) {
      if (!phoneNumber.trim()) {
        alert("Please enter your mobile phone number to ensure multi-factor verification.");
        return;
      }
      setStep(5);
    } else if (step === 5) {
      if (password.length > 0 && password.length < 6) {
        alert("Password must contain at least 6 characters.");
        return;
      }
      setStep(6);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleAgreeAndFinish = () => {
    const finalDisplayName = `${firstName.trim()} ${lastName.trim()}`;
    onComplete({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      birthday: birthday,
      gender: gender,
      phoneNumber: phoneNumber.trim(),
      termsAgreed: true,
      displayName: finalDisplayName
    });
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between ${
      isDark ? 'bg-[#0F1011] text-white' : 'bg-slate-50 text-slate-900'
    } transition-colors duration-200 font-sans`}>
      
      {/* Top Banner & Indicator */}
      <header className={`px-6 py-4 flex items-center justify-between border-b ${
        isDark ? 'border-zinc-900 bg-[#161719]' : 'border-zinc-200 bg-white'
      }`}>
        <div className="flex items-center gap-2">
          {step > 1 ? (
            <button 
              onClick={handleBack}
              className={`p-2 rounded-xl transition cursor-pointer ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-600 hover:text-black'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={onLogout}
              className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
            >
              Logout / Exit
            </button>
          )}
          <span className="text-xs font-black uppercase tracking-widest text-neutral-800 dark:text-neutral-200">
            Zivobook Setup ID
          </span>
        </div>

        {/* Step dots */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <span 
              key={idx}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === step 
                  ? 'w-6 bg-black dark:bg-white' 
                  : idx < step 
                    ? 'w-2 bg-neutral-400 dark:bg-neutral-600' 
                    : 'w-2 bg-zinc-300 dark:bg-zinc-850'
              }`}
            />
          ))}
        </div>
      </header>

      {/* Main Form Center Box */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-10 max-w-md w-full mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full space-y-7"
          >
            {/* STEP 1: Name Input Screen */}
            {step === 1 && (
              <div className="space-y-6 text-left">
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-black dark:text-white">
                    What's your name?
                  </h2>
                  <p className={`text-sm tracking-tight font-bold ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>
                    Enter the name you use in real life.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                      First name
                    </label>
                    <input 
                      type="text" 
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={`w-full p-4 rounded-2xl border text-sm font-bold outline-none transition focus:ring-2 focus:ring-black dark:focus:ring-white ${
                        isDark 
                          ? 'bg-[#18191A] border-zinc-800 text-white focus:border-zinc-500' 
                          : 'bg-white border-zinc-200 text-black focus:border-[#222]'
                      }`}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={`text-xs font-black uppercase tracking-wider ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                      Last name
                    </label>
                    <input 
                      type="text" 
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={`w-full p-4 rounded-2xl border text-sm font-bold outline-none transition focus:ring-2 focus:ring-black dark:focus:ring-white ${
                        isDark 
                          ? 'bg-[#18191A] border-zinc-800 text-white focus:border-zinc-500' 
                          : 'bg-white border-zinc-200 text-black focus:border-[#222]'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: Birthday Input Screen */}
            {step === 2 && (
              <div className="space-y-6 text-left">
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-black dark:text-white">
                    What's your birthday?
                  </h2>
                  <p className={`text-xs md:text-sm tracking-tight leading-relaxed font-bold ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>
                    Choose your date of birth. You can always make this private later.{' '}
                    <span className="text-neutral-800 dark:text-neutral-200 font-black hover:underline cursor-pointer block mt-1">
                      Why do I need to provide my birthday?
                    </span>
                  </p>
                </div>

                <div className={`p-5 rounded-2xl border ${
                  isDark ? 'bg-[#18191A] border-zinc-800' : 'bg-white border-zinc-250'
                }`}>
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                    Birthday ({currentAge} years old)
                  </label>
                  <p className="text-lg font-black text-black dark:text-white mb-3">
                    {formatBirthdayToShow(birthday)}
                  </p>
                  
                  <input 
                    type="date"
                    value={birthday}
                    onChange={(e) => setBirthday(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-xs font-bold outline-none cursor-pointer ${
                      isDark 
                        ? 'bg-[#1A1B1C] border-zinc-800 text-white' 
                        : 'bg-slate-50 border-zinc-200 text-black'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* STEP 3: Gender Selection Screen */}
            {step === 3 && (
              <div className="space-y-6 text-left">
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-black dark:text-white">
                    What's your gender?
                  </h2>
                  <p className={`text-sm tracking-tight font-bold ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>
                    You can change who sees your gender on your profile later.
                  </p>
                </div>

                <div className={`border rounded-2xl overflow-hidden divider-y ${
                  isDark ? 'border-zinc-800 bg-[#18191A]' : 'border-zinc-200 bg-white'
                }`}>
                  {/* Female */}
                  <div 
                    onClick={() => setGender('female')}
                    className={`flex items-center justify-between p-4 cursor-pointer transition ${
                      gender === 'female' 
                        ? (isDark ? 'bg-white/10 text-white' : 'bg-neutral-150 text-black') 
                        : isDark ? 'hover:bg-zinc-800/50 text-neutral-300' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-black dark:text-white">Female</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      gender === 'female' 
                        ? (isDark ? 'border-white bg-white' : 'border-black bg-black') 
                        : 'border-zinc-400'
                    }`}>
                      {gender === 'female' && <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-black' : 'bg-white'}`} />}
                    </div>
                  </div>

                  <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                  {/* Male */}
                  <div 
                    onClick={() => setGender('male')}
                    className={`flex items-center justify-between p-4 cursor-pointer transition ${
                      gender === 'male' 
                        ? (isDark ? 'bg-white/10 text-white' : 'bg-neutral-150 text-black') 
                        : isDark ? 'hover:bg-zinc-800/50 text-neutral-300' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-bold text-black dark:text-white">Male</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      gender === 'male' 
                        ? (isDark ? 'border-white bg-white' : 'border-black bg-black') 
                        : 'border-zinc-400'
                    }`}>
                      {gender === 'male' && <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-black' : 'bg-white'}`} />}
                    </div>
                  </div>

                  <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                  {/* More options */}
                  <div 
                    onClick={() => setGender('other')}
                    className={`flex items-center justify-between p-4 cursor-pointer transition ${
                      gender === 'other' 
                        ? (isDark ? 'bg-white/10 text-white' : 'bg-neutral-150 text-black') 
                        : isDark ? 'hover:bg-zinc-800/50 text-neutral-300' : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="space-y-0.5 text-left">
                      <p className="text-sm font-bold text-black dark:text-white">More options</p>
                      <p className={`text-[10.5px] leading-tight font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                        Select More options to choose another gender or if you'd rather not say.
                      </p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      gender === 'other' 
                        ? (isDark ? 'border-white bg-white' : 'border-black bg-black') 
                        : 'border-zinc-400'
                    }`}>
                      {gender === 'other' && <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-black' : 'bg-white'}`} />}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: Phone Input Screen */}
            {step === 4 && (
              <div className="space-y-6 text-left">
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-black dark:text-white">
                    What's your mobile number?
                  </h2>
                  <p className={`text-sm tracking-tight font-bold ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>
                    Enter the mobile number where you can be contacted. No one will see this on your profile.
                  </p>
                </div>

                <div className="space-y-2">
                  <input 
                    type="tel" 
                    placeholder="Mobile number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`w-full p-4 rounded-2xl border text-sm font-black outline-none transition focus:ring-2 focus:ring-black dark:focus:ring-white ${
                      isDark 
                        ? 'bg-[#18191A] border-zinc-800 text-white focus:border-zinc-500' 
                        : 'bg-white border-zinc-200 text-black focus:border-[#222]'
                    }`}
                  />
                  <p className={`text-[10px] leading-relaxed pt-1 select-none font-semibold ${isDark ? 'text-neutral-200' : 'text-neutral-800'}`}>
                    You may receive WhatsApp and SMS notifications from us.{' '}
                    <span className="text-neutral-800 dark:text-zinc-300 font-black hover:text-black dark:hover:text-white underline cursor-pointer">Learn more</span>
                  </p>
                </div>
              </div>
            )}

            {/* STEP 5: Create Password Screen */}
            {step === 5 && (
              <div className="space-y-6 text-left">
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-black dark:text-white">
                    Create a password
                  </h2>
                  <p className={`text-sm leading-relaxed tracking-tight font-bold ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>
                    Create a password with at least 6 letters or numbers. It should be something others can't guess.
                  </p>
                </div>

                <div className="space-y-4">
                  <input 
                    type="password" 
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full p-4 rounded-2xl border text-sm font-black outline-none transition focus:ring-2 focus:ring-black dark:focus:ring-white ${
                      isDark 
                        ? 'bg-[#18191A] border-zinc-800 text-white focus:border-zinc-500' 
                        : 'bg-white border-zinc-200 text-black focus:border-[#222]'
                    }`}
                  />

                  {/* Custom checkmark field */}
                  <div 
                    onClick={() => setRememberLogin(!rememberLogin)}
                    className="flex items-center gap-2.5 cursor-pointer py-1 text-xs select-none"
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                      rememberLogin 
                        ? (isDark ? 'bg-white border-white' : 'bg-black border-black') 
                        : 'border-zinc-400'
                    }`}>
                      {rememberLogin && <Check className={`w-3 h-3 stroke-[3.5] ${isDark ? 'text-black' : 'text-white'}`} />}
                    </div>
                    <span className={isDark ? 'text-neutral-100 font-bold' : 'text-neutral-900 font-black'}>
                      Remember login info. <span className="text-neutral-800 dark:text-neutral-250 hover:text-black dark:hover:text-white underline font-black">Learn more</span>
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: Agree terms */}
            {step === 6 && (
              <div className="space-y-6 text-left">
                <div className="space-y-2">
                  <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-black dark:text-white">
                     Agree to Zivobook's terms and policies
                  </h2>
                </div>

                <div className={`text-xs space-y-4 leading-relaxed ${isDark ? 'text-neutral-100' : 'text-neutral-900'}`}>
                  <p className="font-bold">
                    People who use our service may have uploaded your contact information to Zivobook.{' '}
                    <span className="text-black dark:text-white font-black underline hover:opacity-80 cursor-pointer">Learn more</span>
                  </p>

                  <p className="font-bold">
                    By tapping <strong className={isDark ? 'text-white' : 'text-black'}>I agree</strong>, you agree to create an account and to Zivobook's{' '}
                    <span className="text-black dark:text-white font-black underline hover:opacity-80 cursor-pointer">Terms</span>,{' '}
                    <span className="text-black dark:text-white font-black underline hover:opacity-80 cursor-pointer">Privacy Policy</span> and{' '}
                    <span className="text-black dark:text-white font-black underline hover:opacity-80 cursor-pointer">Cookies Policy</span>.
                  </p>

                  <p className="font-bold">
                    The <span className="text-black dark:text-white font-black underline hover:opacity-80 cursor-pointer">Privacy Policy</span> describes the ways we can use the information we collect when you create an account. For example, we use this information to provide, personalize and improve our products, including secure decentralized trust validations.
                  </p>
                </div>
              </div>
            )}

            {/* NEXT BUTTON FOR STEPS 1-5 */}
            {step < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className={`w-full font-black py-4 rounded-full text-xs tracking-wider uppercase transition-all duration-150 shadow-md cursor-pointer active:scale-[0.98] ${
                  isDark 
                    ? 'bg-white hover:bg-neutral-200 text-black shadow-white/5' 
                    : 'bg-black hover:bg-neutral-800 text-white shadow-black/10'
                }`}
              >
                Next
              </button>
            ) : (
              /* THE FINAL SUBMIT ACTION */
              <button
                type="button"
                onClick={handleAgreeAndFinish}
                className={`w-full font-black py-4 rounded-full text-xs tracking-wider uppercase transition-all duration-150 shadow-md cursor-pointer active:scale-[0.98] ${
                  isDark 
                    ? 'bg-white hover:bg-neutral-200 text-black shadow-white/5' 
                    : 'bg-black hover:bg-neutral-800 text-white shadow-black/10'
                }`}
              >
                I agree
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Trust Badge Footer */}
      <footer className="py-6 text-center text-[10px] font-mono tracking-widest uppercase text-zinc-500">
        🔐 Secured by ZivoGuard Cryptographic Firewall
      </footer>
    </div>
  );
};
