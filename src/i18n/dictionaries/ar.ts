import type { PartialDictionary } from "../types";

/**
 * العربية — partial. Missing keys fall back to English at runtime.
 * TODO(i18n): professional translation + native review before launch.
 */
const dict: PartialDictionary = {
  meta: { homeTitle: "شركاء STUDIO — بِع STUDIO واربح 1500 يورو عن كل عملية بيع", homeDescription: "كن شريكًا في STUDIO. نحن نبنيه ونسلّمه — وأنت تجلب الفرصة وتحصل على عمولة متكررة بنسبة 50٪." },
  common: { perYear: "/ سنة", copy: "نسخ", copied: "تم النسخ", save: "حفظ", cancel: "إلغاء", language: "اللغة", theme: "المظهر", themeLight: "فاتح", themeDark: "داكن", themeSystem: "النظام", menu: "القائمة",
    illustrationOnly: "أمثلة حسابية بحتة مبنية على السعر العام ونسبة العمولة القياسية، وليست وعدًا بالدخل. تُستحق العمولات فقط على المبيعات المؤهلة التي تم تحصيل دفعها فعليًا." },
  nav: { howItWorks: "كيف يعمل", whatYouSell: "ماذا تبيع", markets: "الأسواق", discover: "اكتشف STUDIO", login: "تسجيل الدخول", becomePartner: "كن شريكًا", dashboard: "لوحة التحكم" },
  home: { eyebrow: "برنامج شركاء STUDIO", heroTitle1: "بِع STUDIO.", heroTitle2: "اربح 1500 يورو عن كل بيع.", heroSubtitle: "نحن نبنيه. نحن نسلّمه. وأنت تجلب الفرصة.", ctaPrimary: "كن شريكًا", ctaSecondary: "اكتشف STUDIO",
    statPrice: "3000 يورو / سنة", statPriceLabel: "السعر العام", statRate: "50٪ متكررة", statRateLabel: "العمولة", statCommission: "1500 يورو", statCommissionLabel: "عمولة محتملة / سنة / عميل نشط",
    ladderTitle: "الحساب بسيط.", ladderClients: "{n} عملاء", ladderClient: "عميل واحد", ladderPerYear: "/ سنة", howTitle: "ثلاث خطوات فقط.",
    steps: { share: { title: "شارك", body: "احصل على رابطك الشخصي ورسائل بيع جاهزة." }, sell: { title: "بِع", body: "قدّم STUDIO للمهنيين في الأسواق المقترحة." }, earn: { title: "اربح", body: "احصل على عمولتك عن المبيعات المؤهلة المحصّلة فعليًا." } },
    sellTitle: "مكان واحد لأعمالهم.", finalTitle: "قد يحقق أول بيع لك عمولة قدرها 1500 يورو." },
  studio: { heroTitle: "حوّل زياراتك إلى فرص.", heroTitle2: "حوّل فرصك إلى مواعيد.", cta: "اطلب STUDIO", pricingPeriod: "سنويًا" },
  auth: { loginTitle: "مرحبًا بعودتك.", registerTitle: "كن شريكًا في STUDIO.", email: "البريد الإلكتروني", password: "كلمة المرور", submitLogin: "تسجيل الدخول", logout: "تسجيل الخروج" },
  dash: { greetingMorning: "صباح الخير، {name}.", greetingAfternoon: "مساء الخير، {name}.", greetingEvening: "مساء الخير، {name}." },
};

export default dict;
