document.addEventListener("DOMContentLoaded", () => {
  const agreeRulesBtn = document.getElementById("agree-button");
  const languageModal = document.getElementById("language-modal");
  const pageContent = document.getElementById("page-content");
  const langAgreeBtn = document.getElementById("lang-agree-btn");
  const langButtons = document.querySelectorAll(".language-btn");

  let selectedLang = null;

  // Step 1: Agree to community rules
  agreeRulesBtn.addEventListener("click", () => {
    document.getElementById("rules-modal").style.display = "none";
    languageModal.classList.remove("hidden");
  });

  // Step 2: Language selection logic
  langButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      selectedLang = btn.dataset.lang;
      langButtons.forEach(b => b.classList.remove("bg-purple-700"));
      btn.classList.add("bg-purple-700");
      langAgreeBtn.disabled = false;
    });
  });

  // Step 3: Agree to language, show page, translate
  langAgreeBtn.addEventListener("click", () => {
    if (!selectedLang) return;

    languageModal.classList.add("hidden");
    pageContent.classList.remove("hidden");

    applyTranslation(selectedLang);
  });

  // Step 4: Complete translation logic
  function applyTranslation(lang) {
    const translations = {
      en: {
        heading: "Welcome to Rejection",
        description: "A place where students, friends, or anonymous users join rooms to talk freely about exams, jobs, struggles & life.",
        create: "Create New Account",
        login: "Already Created",
        forgot: "Forgot Password?"
      },
      hi: {
        heading: "रिजेक्शन में आपका स्वागत है",
        description: "यह एक ऐसा स्थान है जहाँ छात्र, मित्र या अज्ञात उपयोगकर्ता परीक्षाओं, नौकरियों और जीवन के बारे में खुलकर बात कर सकते हैं।",
        create: "नया खाता बनाएं",
        login: "पहले से बनाया हुआ",
        forgot: "पासवर्ड भूल गए?"
      },
      kn: {
        heading: "ರಿಜೆಕ್ಷನ್ಗೆ ಸುಸ್ವಾಗತ",
        description: "ವಿದ್ಯಾರ್ಥಿಗಳು, ಸ್ನೇಹಿತರು ಅಥವಾ ಅನಾಮಧೇಯ ಬಳಕೆದಾರರು ಪರೀಕ್ಷೆಗಳು, ಉದ್ಯೋಗಗಳು ಮತ್ತು ಜೀವನದ ಬಗ್ಗೆ ಮುಕ್ತವಾಗಿ ಮಾತನಾಡಲು ಕೋಣೆಗಳಿಗೆ ಸೇರುವ ಸ್ಥಳ.",
        create: "ಹೊಸ ಖಾತೆಯನ್ನು ರಚಿಸಿ",
        login: "ಈಗಾಗಲೇ ರಚಿಸಲಾಗಿದೆ",
        forgot: "ಪಾಸ್ವರ್ಡ್ ಮರೆತಿರಾ?"
      },
      ta: {
        heading: "ரிஜெக்ஷனுக்கு வரவேற்கிறோம்",
        description: "மாணவர்கள், நண்பர்கள் அல்லது அநாமதேய பயனர்கள் தேர்வுகள், வேலைகள் மற்றும் வாழ்க்கை பற்றி தாராளமாக பேச அறைகளில் சேரும் இடம்.",
        create: "புதிய கணக்கை உருவாக்கவும்",
        login: "ஏற்கனவே உருவாக்கப்பட்டது",
        forgot: "கடவுச்சொல்லை மறந்துவிட்டீர்களா?"
      },
      te: {
        heading: "రిజెక్షన్‌కు స్వాగతం",
        description: "విద్యార్థులు, స్నేహితులు లేదా అనామక వినియోగదారులు పరీక్షలు, ఉద్యోగాలు మరియు జీవితం గురించి స్వేచ్ఛగా మాట్లాడటానికి గదులలో చేరే ప్రదేశం.",
        create: "కొత్త ఖాతాను సృష్టించండి",
        login: "ఇప్పటికే సృష్టించబడింది",
        forgot: "పాస్‌వర్డ్ మర్చిపోయారా?"
      },
      ml: {
        heading: "റിജെക്ഷനിലേക്ക് സ്വാഗതം",
        description: "വിദ്യാർത്ഥികൾ, സുഹൃത്തുക്കൾ അല്ലെങ്കിൽ അജ്ഞാത ഉപയോക്താക്കൾ പരീക്ഷകൾ, ജോലികൾ, പോരാട്ടങ്ങൾ, ജീവിതം എന്നിവയെക്കുറിച്ച് സ്വതന്ത്രമായി സംസാരിക്കാൻ മുറികളിൽ ചേരുന്ന ഒരു സ്ഥലം.",
        create: "പുതിയ അക്കൗണ്ട് സൃഷ്ടിക്കുക",
        login: "ഇതിനകം സൃഷ്ടിച്ചു",
        forgot: "പാസ്‌വേഡ് മറന്നുപോയോ?"
      },
      bn: {
        heading: "রিজেকশনে স্বাগতম",
        description: "একটি জায়গা যেখানে শিক্ষার্থী, বন্ধু বা বেনামী ব্যবহারকারীরা পরীক্ষা, চাকরি, সংগ্রাম ও জীবন নিয়ে অবাধে কথা বলার জন্য রুমে যোগ দেয়।",
        create: "নতুন অ্যাকাউন্ট তৈরি করুন",
        login: "ইতিমধ্যে তৈরি করা হয়েছে",
        forgot: "পাসওয়ার্ড ভুলে গেছেন?"
      },
      ur: {
        heading: "ریجیکشن میں خوش آمدید",
        description: "ایک ایسی جگہ جہاں طلباء، دوست یا گمنام صارفین امتحانات، ملازمتوں اور زندگی کے بارے میں آزادانہ بات کرنے کے لیے کمرے میں شامل ہوتے ہیں۔",
        create: "نیا اکاؤنٹ بنائیں",
        login: "پہلے سے بنایا ہوا",
        forgot: "پاسورڈ بھول گئے؟"
      },
      fr: {
        heading: "Bienvenue sur Rejection",
        description: "Un endroit où les étudiants, amis ou utilisateurs anonymes rejoignent des salles pour parler librement des examens, des emplois et de la vie.",
        create: "Créer un nouveau compte",
        login: "Déjà créé",
        forgot: "Mot de passe oublié?"
      },
      de: {
        heading: "Willkommen bei Rejection",
        description: "Ein Ort, an dem Schüler, Freunde oder anonyme Benutzer Räume betreten, um frei über Prüfungen, Jobs und das Leben zu sprechen.",
        create: "Neues Konto erstellen",
        login: "Bereits erstellt",
        forgot: "Passwort vergessen?"
      },
      ru: {
        heading: "Добро пожаловать в Rejection",
        description: "Место, где студенты, друзья или анонимные пользователи присоединяются к комнатам, чтобы свободно говорить об экзаменах, работе и жизни.",
        create: "Создать новый аккаунт",
        login: "Уже создан",
        forgot: "Забыли пароль?"
      },
      es: {
        heading: "Bienvenido a Rejection",
        description: "Un lugar donde estudiantes, amigos o usuarios anónimos se unen a salas para hablar libremente sobre exámenes, trabajos y la vida.",
        create: "Crear nueva cuenta",
        login: "Ya creado",
        forgot: "¿Olvidaste tu contraseña?"
      },
      it: {
        heading: "Benvenuto in Rejection",
        description: "Un luogo dove studenti, amici o utenti anonimi si uniscono alle stanze per parlare liberamente di esami, lavori e vita.",
        create: "Crea nuovo account",
        login: "Già creato",
        forgot: "Password dimenticata?"
      },
      zh: {
        heading: "欢迎来到 Rejection",
        description: "一个学生、朋友或匿名用户可以自由讨论考试、工作和生活的平台。",
        create: "创建新账户",
        login: "已有账户",
        forgot: "忘记密码？"
      },
      ja: {
        heading: "Rejectionへようこそ",
        description: "学生、友人、匿名ユーザーが試験、仕事、人生について自由に話し合うための場所です。",
        create: "新しいアカウントを作成",
        login: "すでに作成済み",
        forgot: "パスワードを忘れた場合"
      },
      ko: {
        heading: "Rejection에 오신 것을 환영합니다",
        description: "학생, 친구 또는 익명 사용자가 시험, 직업 및 삶에 대해 자유롭게 이야기할 수 있는 공간입니다.",
        create: "새 계정 만들기",
        login: "이미 생성됨",
        forgot: "비밀번호를 잊으셨나요?"
      },
      vi: {
        heading: "Chào mừng đến với Rejection",
        description: "Nơi sinh viên, bạn bè hoặc người dùng ẩn danh tham gia các phòng để nói chuyện tự do về thi cử, công việc và cuộc sống.",
        create: "Tạo tài khoản mới",
        login: "Đã tạo",
        forgot: "Quên mật khẩu?"
      },
      tr: {
        heading: "Rejection'a Hoş Geldiniz",
        description: "Öğrencilerin, arkadaşların veya anonim kullanıcıların sınavlar, işler ve yaşam hakkında özgürce konuşmak için odalara katıldığı bir yer.",
        create: "Yeni Hesap Oluştur",
        login: "Zaten Oluşturuldu",
        forgot: "Parolanızı mı unuttunuz?"
      },
      fa: {
        heading: "به ریجکشن خوش آمدید",
        description: "مکانی که دانشجویان، دوستان یا کاربران ناشناس برای گفتگوی آزاد درباره امتحانات، شغل و زندگی به اتاق‌ها می‌پیوندند.",
        create: "ایجاد حساب جدید",
        login: "قبلاً ایجاد شده",
        forgot: "رمز عبور را فراموش کرده‌اید؟"
      },
      pt: {
        heading: "Bem-vindo ao Rejection",
        description: "Um lugar onde estudantes, amigos ou usuários anônimos se juntam a salas para falar livremente sobre exames, empregos e vida.",
        create: "Criar nova conta",
        login: "Já criado",
        forgot: "Esqueceu a senha?"
      },
      pl: {
        heading: "Witamy w Rejection",
        description: "Miejsce, w którym studenci, przyjaciele lub anonimowi użytkownicy dołączają do pokoi, aby swobodnie rozmawiać o egzaminach, pracy i życiu.",
        create: "Utwórz nowe konto",
        login: "Już utworzono",
        forgot: "Zapomniałeś hasła?"
      },
      nl: {
        heading: "Welkom bij Rejection",
        description: "Een plek waar studenten, vrienden of anonieme gebruikers vrij kunnen praten over examens, banen en het leven.",
        create: "Nieuw account aanmaken",
        login: "Al account",
        forgot: "Wachtwoord vergeten?"
      },
      th: {
        heading: "ยินดีต้อนรับสู่ Rejection",
        description: "สถานที่ที่นักเรียน เพื่อน หรือผู้ใช้ที่ไม่ระบุตัวตนเข้าร่วมห้องเพื่อพูดคุยอย่างอิสระเกี่ยวกับการสอบ งาน และชีวิต",
        create: "สร้างบัญชีใหม่",
        login: "สร้างไว้แล้ว",
        forgot: "ลืมรหัสผ่าน?"
      },
      ar: {
        heading: "مرحبًا بكم في Rejection",
        description: "مكان يجتمع فيه الطلاب والأصدقاء أو المستخدمون المجهولون للتحدث بحرية عن الامتحانات والوظائف والحياة.",
        create: "إنشاء حساب جديد",
        login: "تم إنشاؤه بالفعل",
        forgot: "هل نسيت كلمة السر؟"
      }
    };

    const t = translations[lang] || translations["en"];
    
    // Update the elements with translations
    document.querySelector("h2").innerText = t.heading;
    document.querySelector("p.text-lg").innerText = t.description;
    document.querySelectorAll("a")[0].innerText = t.create;
    document.querySelectorAll("a")[1].innerText = t.login;
    document.querySelectorAll("a")[2].innerText = t.forgot;
    
    // Also update the marquee text
    const marqueeTexts = {
      en: "🎓 Speak your mind. Stay anonymous. Create your own room, or just listen in!",
      hi: "🎓 अपनी बात कहें। गुमनाम रहें। अपना कमरा बनाएं, या बस सुनें!",
      // Add translations for other languages as needed
      // Default will fall back to English
    };
    
    const marqueeText = marqueeTexts[lang] || marqueeTexts["en"];
    document.querySelector(".animate-marquee").innerText = marqueeText;
  }
  
  // Function to open language modal from navbar
  window.openLanguageModal = function() {
    languageModal.classList.remove("hidden");
    pageContent.classList.add("hidden");
  };
});