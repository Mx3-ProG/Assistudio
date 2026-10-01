import type { PartialDictionary } from "../types";

/**
 * العربية — partial. Missing keys fall back to English at runtime.
 * TODO(i18n): professional translation + native review before launch.
 */
const dict: PartialDictionary = {
  meta: { homeTitle: "شركاء Studio ATS — بِع Studio ATS واربح حتى 1500 يورو عن كل عملية بيع", homeDescription: "كن شريكًا في Studio ATS. نحن نبنيه ونسلّمه — وأنت تجلب الفرصة وتحصل على عمولة متكررة بنسبة 25٪." },
  common: { perYear: "/ سنة", copy: "نسخ", copied: "تم النسخ", save: "حفظ", cancel: "إلغاء", language: "اللغة", currency: "عملة العرض", currencyNote: "التحويل تقريبي فقط. ستؤكد Stripe العملة والمبلغ النهائي عند الدفع.", theme: "المظهر", themeLight: "فاتح", themeDark: "داكن", themeSystem: "النظام", menu: "القائمة",
    illustrationOnly: "أمثلة حسابية بحتة مبنية على السعر العام لـ Studio Premium ونسبة العمولة القياسية، وليست وعدًا بالدخل. تُستحق العمولات فقط على المبيعات المؤهلة التي تم تحصيل دفعها فعليًا." },
  nav: { howItWorks: "كيف يعمل", whatYouSell: "ماذا تبيع", markets: "الأسواق", discover: "اكتشف Studio ATS", faq: "الأسئلة", login: "تسجيل الدخول", becomePartner: "كن شريكًا", pricing: "الأسعار", dashboard: "لوحة التحكم" },
  home: { eyebrow: "برنامج شركاء Studio ATS", heroTitle1: "بِع Studio ATS.", heroTitle2: "اربح حتى 1500 يورو عن كل بيع.", heroSubtitle: "نحن نبنيه. نحن نسلّمه. وأنت تجلب الفرصة.", ctaPrimary: "كن شريكًا", ctaSecondary: "اكتشف Studio ATS",
    statPrice: "6000 يورو / سنة", statPriceLabel: "السعر العام لـ Studio Premium", statRate: "25٪ متكررة", statRateLabel: "العمولة", statCommission: "1500 يورو", statCommissionLabel: "الحد الأقصى للعمولة / سنة / عميل نشط",
    ladderTitle: "الحساب بسيط.", ladderClients: "{n} عملاء", ladderClient: "عميل واحد", ladderPerYear: "/ سنة", howTitle: "ثلاث خطوات فقط.",
    steps: { share: { title: "شارك", body: "احصل على رابطك الشخصي ورسائل بيع جاهزة." }, sell: { title: "بِع", body: "قدّم Studio ATS للمهنيين في الأسواق المقترحة." }, earn: { title: "اربح", body: "احصل على عمولتك عن المبيعات المؤهلة المحصّلة فعليًا." } },
    sellTitle: "مكان واحد لأعمالهم.", finalTitle: "قد يحقق أول بيع لك عمولة تصل إلى 1500 يورو." },
  studio: { heroTitle: "حوّل زياراتك إلى فرص.", heroTitle2: "حوّل فرصك إلى مواعيد.", cta: "اطلب Studio ATS" },
  auth: { loginTitle: "مرحبًا بعودتك.", registerTitle: "كن شريكًا في Studio ATS.", email: "البريد الإلكتروني", password: "كلمة المرور", submitLogin: "تسجيل الدخول", logout: "تسجيل الخروج" },
  dash: { greetingMorning: "صباح الخير، {name}.", greetingAfternoon: "مساء الخير، {name}.", greetingEvening: "مساء الخير، {name}." },
  cookieBanner: { text: "نستخدم ملفات تعريف ضرورية، منها ملف إحالة لاحتساب الشريك الذي أوصى بـ Studio ATS. تبقى ملفات التحليل الاختيارية معطلة حتى توافق.", accept: "قبول التحليل", decline: "الضرورية فقط", policy: "سياسة ملفات التعريف" },
};

export default dict;
